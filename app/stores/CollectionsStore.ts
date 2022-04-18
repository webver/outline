import invariant from "invariant";
import { concat, find, last } from "lodash";
import { computed, action } from "mobx";
import Collection from "~/models/Collection";
import { NavigationNode } from "~/types";
import { client } from "~/utils/ApiClient";
import BaseStore from "./BaseStore";
import RootStore from "./RootStore";

enum DocumentPathItemType {
  Collection = "collection",
  Document = "document",
}

export type DocumentPathItem = {
  type: DocumentPathItemType;
  id: string;
  collectionId: string;
  title: string;
  url: string;
};

export type DocumentPath = DocumentPathItem & {
  path: DocumentPathItem[];
};

export default class CollectionsStore extends BaseStore<Collection> {
  constructor(rootStore: RootStore) {
    super(rootStore, Collection);
  }

  @computed
  get active(): Collection | null | undefined {
    return this.rootStore.ui.activeCollectionId
      ? this.data.get(this.rootStore.ui.activeCollectionId)
      : undefined;
  }

  @computed
  get orderedData(): Collection[] {
    let collections = Array.from(this.data.values());
    collections = collections.filter((collection) =>
      collection.deletedAt ? false : true
    );
    return collections.sort((a, b) => {
      if (a.index === b.index) {
        return a.updatedAt > b.updatedAt ? -1 : 1;
      }

      return a.index < b.index ? -1 : 1;
    });
  }

  /**
   * List of paths to each of the documents, where paths are composed of id and title/name pairs
   */
  @computed
  get pathsToDocuments(): DocumentPath[] {
    const results: DocumentPathItem[][] = [];

    const travelDocuments = (
      documentList: NavigationNode[],
      collectionId: string,
      path: DocumentPathItem[]
    ) =>
      documentList.forEach((document: NavigationNode) => {
        const { id, title, url } = document;
        const node = {
          type: DocumentPathItemType.Document,
          id,
          collectionId,
          title,
          url,
        };
        results.push(concat(path, node));
        travelDocuments(document.children, collectionId, concat(path, [node]));
      });

    if (this.isLoaded) {
      this.data.forEach((collection) => {
        const { id, name, url } = collection;
        const node = {
          type: DocumentPathItemType.Collection,
          id,
          collectionId: id,
          title: name,
          url,
        };
        results.push([node]);
        travelDocuments(collection.documents, id, [node]);
      });
    }

    return results.map((result) => {
      const tail = last(result) as DocumentPathItem;
      return { ...tail, path: result };
    });
  }

  @action
  import = async (attachmentId: string) => {
    await client.post("/collections.import", {
      type: "outline",
      attachmentId,
    });
  };

  @action
  move = async (collectionId: string, index: string) => {
    const res = await client.post("/collections.move", {
      id: collectionId,
      index,
    });
    invariant(res?.success, "Collection could not be moved");
    const collection = this.get(collectionId);

    if (collection) {
      collection.updateIndex(res.data.index);
    }
  };

  async update(params: Record<string, any>): Promise<Collection> {
    const result = await super.update(params);

    // If we're changing sharing permissions on the collection then we need to
    // remove all locally cached policies for documents in the collection as they
    // are now invalid
    if (params.sharing !== undefined) {
      const collection = this.get(params.id);

      if (collection) {
        collection.documentIds.forEach((id) => {
          this.rootStore.policies.remove(id);
        });
      }
    }

    return result;
  }

  @action
  async fetch(
    id: string,
    options: Record<string, any> = {}
  ): Promise<Collection> {
    const item = this.get(id) || this.getByUrl(id);
    if (item && !options.force) {
      return item;
    }
    this.isFetching = true;

    try {
      const res = await client.post(`/collections.info`, {
        id,
      });
      invariant(res?.data, "Collection not available");
      this.addPolicies(res.policies);
      return this.add(res.data);
    } catch (err) {
      if (err.statusCode === 403) {
        this.remove(id);
      }

      throw err;
    } finally {
      this.isFetching = false;
    }
  }

  @computed
  get publicCollections() {
    return this.orderedData.filter((collection) =>
      ["read", "read_write"].includes(collection.permission || "")
    );
  }

  star = async (collection: Collection) => {
    await this.rootStore.stars.create({
      collectionId: collection.id,
    });
  };

  unstar = async (collection: Collection) => {
    const star = this.rootStore.stars.orderedData.find(
      (star) => star.collectionId === collection.id
    );
    await star?.delete();
  };

  getPathForDocument(documentId: string): DocumentPath | undefined {
    return this.pathsToDocuments.find((path) => path.id === documentId);
  }

  titleForDocument(documentUrl: string): string | undefined {
    const path = this.pathsToDocuments.find((path) => path.url === documentUrl);
    if (path) {
      return path.title;
    }

    return;
  }

  getByUrl(url: string): Collection | null | undefined {
    return find(this.orderedData, (col: Collection) => url.endsWith(col.urlId));
  }

  delete = async (collection: Collection) => {
    await super.delete(collection);
    this.rootStore.documents.fetchRecentlyUpdated();
    this.rootStore.documents.fetchRecentlyViewed();
  };

  export = () => {
    return client.post("/collections.export_all");
  };
}
