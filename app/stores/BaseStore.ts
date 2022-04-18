import invariant from "invariant";
import { orderBy } from "lodash";
import { observable, action, computed, runInAction } from "mobx";
import { Class } from "utility-types";
import RootStore from "~/stores/RootStore";
import BaseModel from "~/models/BaseModel";
import Policy from "~/models/Policy";
import { PaginationParams } from "~/types";
import { client } from "~/utils/ApiClient";

type PartialWithId<T> = Partial<T> & { id: string };

export enum RPCAction {
  Info = "info",
  List = "list",
  Create = "create",
  Update = "update",
  Delete = "delete",
  Count = "count",
}

type FetchPageParams = PaginationParams & Record<string, any>;

function modelNameFromClassName(string: string) {
  return string.charAt(0).toLowerCase() + string.slice(1);
}

export const DEFAULT_PAGINATION_LIMIT = 25;

export const PAGINATION_SYMBOL = Symbol.for("pagination");

export default abstract class BaseStore<T extends BaseModel> {
  @observable
  data: Map<string, T> = new Map();

  @observable
  isFetching = false;

  @observable
  isSaving = false;

  @observable
  isLoaded = false;

  model: Class<T>;

  modelName: string;

  apiEndpoint: string;

  rootStore: RootStore;

  actions = [
    RPCAction.Info,
    RPCAction.List,
    RPCAction.Create,
    RPCAction.Update,
    RPCAction.Delete,
    RPCAction.Count,
  ];

  constructor(rootStore: RootStore, model: Class<T>) {
    this.rootStore = rootStore;
    this.model = model;
    this.modelName = modelNameFromClassName(model.name);

    if (!this.apiEndpoint) {
      this.apiEndpoint = `${this.modelName}s`;
    }
  }

  @action
  clear() {
    this.data.clear();
  }

  addPolicies = (policies: Policy[]) => {
    if (policies) {
      policies.forEach((policy) => this.rootStore.policies.add(policy));
    }
  };

  @action
  add = (item: PartialWithId<T> | T): T => {
    const ModelClass = this.model;

    if (!(item instanceof ModelClass)) {
      const existingModel = this.data.get(item.id);

      if (existingModel) {
        existingModel.updateFromJson(item);
        return existingModel;
      }

      const newModel = new ModelClass(item, this);
      this.data.set(newModel.id, newModel);
      return newModel;
    }

    this.data.set(item.id, item);
    return item;
  };

  @action
  remove(id: string): void {
    this.data.delete(id);
  }

  save(params: Partial<T>): Promise<T> {
    if (params.id) {
      return this.update(params);
    }
    return this.create(params);
  }

  get(id: string): T | undefined {
    return this.data.get(id);
  }

  @action
  async create(
    params: Partial<T>,
    options?: Record<string, string | boolean | number | undefined>
  ): Promise<T> {
    if (!this.actions.includes(RPCAction.Create)) {
      throw new Error(`Cannot create ${this.modelName}`);
    }

    this.isSaving = true;

    try {
      const res = await client.post(`/${this.apiEndpoint}.create`, {
        ...params,
        ...options,
      });

      invariant(res?.data, "Data should be available");
      this.addPolicies(res.policies);
      return this.add(res.data);
    } finally {
      this.isSaving = false;
    }
  }

  @action
  async update(
    params: Partial<T>,
    options?: Record<string, string | boolean | number | undefined>
  ): Promise<T> {
    if (!this.actions.includes(RPCAction.Update)) {
      throw new Error(`Cannot update ${this.modelName}`);
    }

    this.isSaving = true;

    try {
      const res = await client.post(`/${this.apiEndpoint}.update`, {
        ...params,
        ...options,
      });

      invariant(res?.data, "Data should be available");
      this.addPolicies(res.policies);
      return this.add(res.data);
    } finally {
      this.isSaving = false;
    }
  }

  @action
  async delete(item: T, options: Record<string, any> = {}) {
    if (!this.actions.includes(RPCAction.Delete)) {
      throw new Error(`Cannot delete ${this.modelName}`);
    }

    this.isSaving = true;

    try {
      await client.post(`/${this.apiEndpoint}.delete`, {
        id: item.id,
        ...options,
      });
      return this.remove(item.id);
    } finally {
      this.isSaving = false;
    }
  }

  @action
  async fetch(id: string, options: Record<string, any> = {}): Promise<T> {
    if (!this.actions.includes(RPCAction.Info)) {
      throw new Error(`Cannot fetch ${this.modelName}`);
    }

    const item = this.data.get(id);
    if (item && !options.force) {
      return item;
    }
    this.isFetching = true;

    try {
      const res = await client.post(`/${this.apiEndpoint}.info`, {
        id,
      });
      invariant(res?.data, "Data should be available");
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

  @action
  fetchPage = async (params: FetchPageParams | undefined): Promise<T[]> => {
    if (!this.actions.includes(RPCAction.List)) {
      throw new Error(`Cannot list ${this.modelName}`);
    }

    this.isFetching = true;

    try {
      const res = await client.post(`/${this.apiEndpoint}.list`, params);
      invariant(res?.data, "Data not available");

      runInAction(`list#${this.modelName}`, () => {
        this.addPolicies(res.policies);
        res.data.forEach(this.add);
        this.isLoaded = true;
      });

      const response = res.data;
      response[PAGINATION_SYMBOL] = res.pagination;
      return response;
    } finally {
      this.isFetching = false;
    }
  };

  @computed
  get orderedData(): T[] {
    return orderBy(Array.from(this.data.values()), "createdAt", "desc");
  }
}
