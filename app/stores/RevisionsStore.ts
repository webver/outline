import invariant from "invariant";
import { filter } from "lodash";
import { action, runInAction } from "mobx";
import BaseStore, { RPCAction } from "~/stores/BaseStore";
import RootStore from "~/stores/RootStore";
import Revision from "~/models/Revision";
import { PaginationParams } from "~/types";
import { client } from "~/utils/ApiClient";

export default class RevisionsStore extends BaseStore<Revision> {
  actions = [RPCAction.List, RPCAction.Info];

  constructor(rootStore: RootStore) {
    super(rootStore, Revision);
  }

  getDocumentRevisions(documentId: string): Revision[] {
    const revisions = filter(this.orderedData, {
      documentId,
    });
    const latestRevision = revisions[0];
    const document = this.rootStore.documents.get(documentId);

    // There is no guarantee that we have a revision that represents the latest
    // state of the document. This pushes a fake revision in at the top if there
    // isn't one
    if (
      latestRevision &&
      document &&
      latestRevision.createdAt !== document.updatedAt
    ) {
      revisions.unshift(
        new Revision(
          {
            id: "latest",
            documentId: document.id,
            title: document.title,
            text: document.text,
            createdAt: document.updatedAt,
            createdBy: document.createdBy,
          },
          this
        )
      );
    }

    return revisions;
  }

  @action
  fetchPage = async (
    options: PaginationParams | undefined
  ): Promise<Revision[]> => {
    this.isFetching = true;

    try {
      const res = await client.post("/revisions.list", options);
      invariant(res?.data, "Document revisions not available");

      let models: Revision[] = [];
      runInAction("RevisionsStore#fetchPage", () => {
        models = res.data.map(this.add);
        this.isLoaded = true;
      });
      return models;
    } finally {
      this.isFetching = false;
    }
  };
}
