"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  BaseModel: () => BaseModel,
  ComponentState: () => ComponentState,
  EntityStateFetcher: () => EntityStateFetcher,
  EntityStateModel: () => EntityStateModel,
  FungibleResourceCollectionState: () => FungibleResourceCollectionState,
  KeyValueStore: () => KeyValueStore,
  MetadataService: () => MetadataService,
  NonFungibleDataModel: () => NonFungibleDataModel,
  NonFungibleResourceCollectionState: () => NonFungibleResourceCollectionState,
  ONE: () => ONE,
  ONE_HUNDRED: () => ONE_HUNDRED,
  PRECISE_ONE: () => PRECISE_ONE,
  PRECISE_ONE_HUNDRED: () => PRECISE_ONE_HUNDRED,
  PRECISE_ZERO: () => PRECISE_ZERO,
  ResourceDetailsRepo: () => ResourceDetailsRepo,
  ZERO: () => ZERO,
  dec: () => dec,
  findIndexes: () => findIndexes,
  optionTransformPlugin: () => optionTransformPlugin,
  toCamelCase: () => toCamelCase
});
module.exports = __toCommonJS(index_exports);

// src/base-model.ts
var import_babylon_gateway_api_sdk = require("@radixdlt/babylon-gateway-api-sdk");

// src/owned-entity/component-state.ts
var ComponentState = class {
  constructor(entity, stateFetcher) {
    this.initialized = false;
    this.entity = entity;
    this.stateFetcher = stateFetcher;
  }
  async init(ledgerStateSelector) {
    const result = await this.stateFetcher.stateApi.stateEntityDetails({
      stateEntityDetailsRequest: {
        at_ledger_state: ledgerStateSelector,
        addresses: [this.entity]
      }
    });
    this.stateFetcher.apiCallCount++;
    if (result.items.length === 0)
      return;
    const details = result.items[0]?.details;
    if (details?.type !== "Component")
      return;
    const rawState = details.state;
    if (!rawState)
      return;
    const value = await this.stateFetcher.fetchField(rawState);
    this.state = value;
  }
};

// src/utils.ts
var import_decimal = __toESM(require("decimal.js"));
import_decimal.default.set({ precision: 50, rounding: import_decimal.default.ROUND_DOWN, toExpNeg: -50, toExpPos: 50 });
var dec = (input) => new import_decimal.default(input);
var ZERO = dec(0);
var ONE = dec(1);
var ONE_HUNDRED = dec(100);
var PRECISE_ZERO = dec(0);
var PRECISE_ONE = dec(1);
var PRECISE_ONE_HUNDRED = dec(100);
function toCamelCase(str) {
  return str.split("_").map(
    (word, index) => index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join("");
}
function findIndexes(arr, predicate) {
  const indexes = [];
  arr.forEach((element, index) => {
    if (predicate(element)) {
      indexes.push(index);
    }
  });
  return indexes;
}

// src/owned-entity/fungible-resource-collection.ts
var FungibleResourceCollectionState = class {
  constructor(entity, stateFetcher) {
    this.values = {};
    this.initialized = false;
    this.entity = entity;
    this.stateFetcher = stateFetcher;
    this.cursor = { cursor: void 0, stateVersion: 0 };
  }
  get hasMore() {
    return !!this.cursor?.cursor;
  }
  get isInitialized() {
    return this.initialized;
  }
  reset() {
    this.values = {};
    this.cursor = { cursor: void 0, stateVersion: 0 };
    this.initialized = false;
  }
  async init({ aggregationLevel, ledgerStateSelector, recursive }) {
    this.reset();
    await this.loadValues({ aggregationLevel, recursive, ledgerStateSelector });
    this.initialized = true;
  }
  setInitialValues({ initialValues }) {
    this.reset();
    if (initialValues.fungible_resources) {
      this.parseValues(initialValues);
    }
    this.initialized = true;
  }
  async loadMore(recursive = false) {
    if (!this.hasMore)
      return;
    await this.loadValues({ recursive });
  }
  getVaultState(vaultAddress) {
    return Object.values(this.values).filter((v) => v.aggregationLevel === "Vault").flatMap((v) => Object.entries(v.vaults)).find(([address]) => address === vaultAddress)?.[1];
  }
  async loadValues({ aggregationLevel, recursive, ledgerStateSelector }) {
    const result = await this.stateFetcher.stateApi.entityFungiblesPage({
      stateEntityFungiblesPageRequest: {
        at_ledger_state: this.cursor?.stateVersion ? { state_version: this.cursor?.stateVersion } : ledgerStateSelector,
        address: this.entity,
        aggregation_level: aggregationLevel,
        cursor: this.cursor?.cursor
      }
    });
    this.stateFetcher.apiCallCount++;
    this.parseValues({ fungible_resources: result, state_version: result.ledger_state.state_version });
    if (recursive && !!this.cursor.cursor) {
      this.loadValues({ aggregationLevel, recursive: true });
    }
  }
  parseValues({ fungible_resources, state_version }) {
    this.cursor = { cursor: fungible_resources?.next_cursor, stateVersion: state_version };
    fungible_resources?.items.forEach((item) => {
      const resourceAddress = item.resource_address;
      if (item.aggregation_level === "Vault") {
        if (this.values[resourceAddress] === void 0) {
          this.values[resourceAddress] = {
            amount: dec(0),
            aggregationLevel: "Vault",
            vaults: {}
          };
        }
        const value = this.values[resourceAddress];
        if (value.aggregationLevel !== "Vault") {
          throw new Error(`Invalid aggregation level: ${value.aggregationLevel}`);
        }
        item.vaults.items.forEach((vault) => {
          const amount = dec(vault.amount);
          value.amount = value.amount.add(amount);
          value.vaults[vault.vault_address] = {
            resourceAddress,
            amount
          };
        });
        this.values[resourceAddress] = value;
      } else {
        this.values[resourceAddress] = {
          amount: dec(item.amount),
          aggregationLevel: "Global"
        };
      }
    });
  }
};

// src/owned-entity/key-value-store.ts
function defaultKeyParser(entryKey, stateFetcher) {
  const res = stateFetcher.fetchField(entryKey.programmatic_json);
  return res;
}
function defaultValueParser(entryValue, stateFetcher) {
  const res = stateFetcher.fetchField(entryValue.programmatic_json);
  return res;
}
var KeyValueStore = class {
  constructor(storeAddress, stateFetcher, defaultValue) {
    this.values = {};
    this.initialized = false;
    this.storeAddress = storeAddress;
    this.stateFetcher = stateFetcher;
    this.defaultValue = defaultValue;
    this.cursor = { cursor: void 0, stateVersion: 0 };
  }
  get hasMore() {
    return !!this.cursor?.cursor;
  }
  get isInitialized() {
    return this.initialized;
  }
  async init(ledgerStateSelector) {
    this.values = {};
    this.cursor = { cursor: void 0, stateVersion: 0 };
    await this.loadValues(ledgerStateSelector);
    this.initialized = true;
  }
  async loadMore() {
    if (!this.hasMore)
      return;
    await this.loadValues();
  }
  getValue(key) {
    return this.values[key] ?? this.defaultValue;
  }
  setDefaultValue(value) {
    this.defaultValue = value;
  }
  async loadValues(ledgerStateSelector) {
    const at_ledger_state = ledgerStateSelector || (this.cursor?.stateVersion ? { state_version: this.cursor?.stateVersion } : ledgerStateSelector);
    const response = await this.stateFetcher.stateApi.keyValueStoreKeys({
      stateKeyValueStoreKeysRequest: {
        key_value_store_address: this.storeAddress,
        cursor: this.cursor?.cursor,
        at_ledger_state
      }
    });
    this.stateFetcher.apiCallCount++;
    this.cursor = {
      cursor: response.next_cursor,
      stateVersion: response.ledger_state.state_version
    };
    const keys = response.items.map((item) => item.key.raw_hex);
    if (keys.length > 0) {
      const response2 = await this.stateFetcher.stateApi.keyValueStoreData({
        stateKeyValueStoreDataRequest: {
          at_ledger_state,
          key_value_store_address: this.storeAddress,
          keys: keys.map((key) => {
            return { key_hex: key };
          })
        }
      });
      this.stateFetcher.apiCallCount++;
      const tasks = response2.entries.map(async (entry) => {
        const [parsed_key, parsed_value] = await Promise.all([
          defaultKeyParser(entry.key, this.stateFetcher),
          defaultValueParser(entry.value, this.stateFetcher)
        ]);
        this.values[parsed_key] = parsed_value;
      });
      await Promise.all(tasks);
    }
  }
};

// src/owned-entity/non-fungible-resource-collection.ts
var NonFungibleResourceCollectionState = class {
  constructor(entity, stateFetcher) {
    this.values = {};
    this.initialized = false;
    this.entity = entity;
    this.stateFetcher = stateFetcher;
    this.cursor = { cursor: void 0, stateVersion: 0 };
    this.initialized = false;
  }
  get hasMore() {
    return !!this.cursor?.cursor;
  }
  get isInitialized() {
    return this.initialized;
  }
  reset() {
    this.values = {};
    this.cursor = { cursor: void 0, stateVersion: 0 };
  }
  async init({ aggregationLevel, ledgerStateSelector, recursive }) {
    this.reset();
    await this.loadValues({ aggregationLevel, recursive, ledgerStateSelector });
    this.initialized = true;
  }
  async setInitialValues({ initialValues }) {
    this.reset();
    this.parseValues(initialValues);
    this.initialized = true;
  }
  async loadMore(recursive = false) {
    if (!this.hasMore)
      return;
    await this.loadValues({ recursive });
  }
  getVaultState(vaultAddress) {
    return Object.values(this.values).filter((v) => v.aggregationLevel === "Vault").flatMap((v) => Object.entries(v.vaults)).find(([address]) => address === vaultAddress)?.[1];
  }
  async loadValues({ aggregationLevel, recursive, ledgerStateSelector }) {
    const result = await this.stateFetcher.stateApi.entityNonFungiblesPage({
      stateEntityNonFungiblesPageRequest: {
        at_ledger_state: this.cursor?.stateVersion ? { state_version: this.cursor?.stateVersion } : ledgerStateSelector,
        aggregation_level: aggregationLevel,
        address: this.entity,
        cursor: this.cursor.cursor,
        opt_ins: {
          non_fungible_include_nfids: true
        }
      }
    });
    this.stateFetcher.apiCallCount++;
    this.parseValues({ non_fungible_resources: result, state_version: result.ledger_state.state_version });
    if (recursive && !!this.cursor.cursor) {
      this.loadValues({ aggregationLevel, recursive: true });
    }
  }
  parseValues({ non_fungible_resources, state_version }) {
    this.cursor = { cursor: non_fungible_resources?.next_cursor, stateVersion: state_version };
    non_fungible_resources?.items.forEach((item) => {
      const resourceAddress = item.resource_address;
      if (item.aggregation_level === "Vault") {
        if (this.values[resourceAddress] === void 0) {
          this.values[resourceAddress] = {
            totalCount: 0,
            ids: [],
            aggregationLevel: "Vault",
            vaults: {}
          };
        }
        const value = this.values[resourceAddress];
        if (value.aggregationLevel !== "Vault") {
          throw new Error(`Invalid aggregation level: ${value.aggregationLevel}`);
        }
        item.vaults.items.forEach((vault) => {
          const totalCount = vault.items?.length ?? 0;
          if (totalCount !== 0) {
            value.totalCount = value.totalCount + totalCount;
            value.ids = value.ids.concat(vault.items ?? []);
            value.vaults[vault.vault_address] = {
              resourceAddress,
              totalCount,
              ids: vault.items ?? []
            };
          }
        });
        if (value.totalCount === 0) {
          delete this.values[resourceAddress];
        } else {
          this.values[resourceAddress] = value;
        }
      } else {
        if (item.amount !== 0) {
          this.values[resourceAddress] = {
            aggregationLevel: "Global",
            totalCount: item.amount
          };
        }
      }
    });
  }
};

// src/state-fetcher.ts
var defaultOptions = {
  loadState: true,
  recursiveFungibleResourceLoading: true,
  recursiveNonFungibleResourceLoading: true,
  loadResourceDetails: false
};
var optionTransformPlugin = {
  enumName: ["Option"],
  parser: (field, fetcher) => {
    if (field.variant_id === "0" || field.variant_name === "None") {
      return void 0;
    }
    const value = field.fields.length === 1 ? fetcher.fetchField(field.fields[0]) : field.fields.map((v) => fetcher.fetchField(v));
    return value;
  }
};
var EntityStateFetcher = class _EntityStateFetcher {
  constructor(gatewayApi, { enumPlugins, tuplePlugins, options } = {}) {
    this.apiCallCount = 0;
    this.enumPlugins = [];
    this.tuplePlugins = [];
    this.resourceStateCache = {};
    this.gatewayApi = gatewayApi;
    this.addEnumPlugin(optionTransformPlugin);
    this.addPlugins({ enumPlugins, tuplePlugins });
    this.options = { ...defaultOptions, ...options };
  }
  get stateApi() {
    return this.gatewayApi.state.innerClient;
  }
  static newBaseState($entityAddress, stateFetcher) {
    return {
      $entityAddress,
      $fungibleResources: new FungibleResourceCollectionState($entityAddress, stateFetcher),
      $nonFungibleResources: new NonFungibleResourceCollectionState($entityAddress, stateFetcher),
      $metadata: {},
      $state: void 0,
      initialized: false
    };
  }
  addPlugins({ enumPlugins, tuplePlugins }) {
    if (enumPlugins)
      this.addEnumPlugin(enumPlugins);
    if (tuplePlugins)
      this.addTuplePlugin(tuplePlugins);
  }
  addEnumPlugin(plugin) {
    if (!Array.isArray(plugin))
      plugin = [plugin];
    this.enumPlugins.push(...plugin);
  }
  addTuplePlugin(plugin) {
    if (!Array.isArray(plugin))
      plugin = [plugin];
    this.tuplePlugins.push(...plugin);
  }
  setOptions(options) {
    this.options = options;
  }
  async fetchEntityState(entityAddressesInput, localFetchOptions = this.options) {
    let returnedStates = [];
    const fetchOptions = { ...this.options, ...localFetchOptions };
    const entityAddresses = [...new Set(entityAddressesInput)];
    const batchSize = 20;
    let batch = [];
    for (let i = 0; i < entityAddresses.length; i += batchSize) {
      batch = entityAddresses.slice(i, i + batchSize);
      const result = await this.stateApi.stateEntityDetails({
        stateEntityDetailsRequest: {
          at_ledger_state: fetchOptions.ledgerStateSelector,
          addresses: batch,
          aggregation_level: "Vault",
          opt_ins: {
            non_fungible_include_nfids: true
          }
        }
      });
      this.apiCallCount++;
      if (result.items.length === 0)
        return [];
      const tasks = result.items.map(async (entity) => {
        const v = _EntityStateFetcher.newBaseState(entity.address, this);
        await Promise.all([
          (async () => {
            if (entity.fungible_resources) {
              v.$fungibleResources.setInitialValues({
                initialValues: { fungible_resources: entity.fungible_resources, state_version: result.ledger_state.state_version }
              });
              if (fetchOptions.recursiveFungibleResourceLoading) {
                await v.$fungibleResources.loadMore(true);
              }
            }
          })(),
          (async () => {
            if (entity.non_fungible_resources) {
              v.$nonFungibleResources.setInitialValues({
                initialValues: { non_fungible_resources: entity.non_fungible_resources, state_version: result.ledger_state.state_version }
              });
              if (fetchOptions.recursiveNonFungibleResourceLoading) {
                await v.$nonFungibleResources.loadMore(true);
              }
            }
          })()
        ]);
        entity.metadata.items.forEach(async (item) => {
          v.$metadata[toCamelCase(item.key)] = item.value.typed?.value ?? item.value.typed?.values;
        });
        if (fetchOptions.loadState) {
          switch (entity.details?.type) {
            case "Component": {
              v.$state = await this.fetchField(entity.details.state);
              break;
            }
            case "FungibleResource":
              v.$state = entity.details;
              break;
            case "NonFungibleResource":
              v.$state = entity.details;
              break;
            case "FungibleVault":
              v.$state = entity.details;
              break;
            case "NonFungibleVault":
              v.$state = entity.details;
              break;
            case "Package":
              v.$state = entity.details;
              break;
            default:
              v.$state = entity.details;
              break;
          }
        }
        v.initialized = true;
        return v;
      });
      const taskResult = await Promise.all(tasks);
      returnedStates = returnedStates.concat(taskResult);
    }
    if (fetchOptions.loadResourceDetails) {
      const resources = returnedStates.map((state) => {
        const resAddress = [];
        Object.entries(state.$fungibleResources.values).forEach(([key, _]) => {
          resAddress.push(key);
        });
        Object.entries(state.$nonFungibleResources.values).forEach(([key, _]) => {
          resAddress.push(key);
        });
        return resAddress;
      }).flat();
      const resourcesStates = await this.fetchResourceState([...new Set(resources)]);
      for (let i = 0; i < returnedStates.length; i++) {
        Object.entries(returnedStates[i].$fungibleResources.values).forEach(([key, _]) => {
          const resState = resourcesStates.find((r) => r.$entityAddress === key);
          if (resState?.$type !== "FungibleResource")
            return;
          returnedStates[i].$fungibleResources.values[key].fungibleDetails = resState;
        });
        Object.entries(returnedStates[i].$nonFungibleResources.values).forEach(([key, _]) => {
          const resState = resourcesStates.find((r) => r.$entityAddress === key);
          if (resState?.$type !== "NonFungibleResource")
            return;
          returnedStates[i].$nonFungibleResources.values[key].nonFungibleDetails = resState;
        });
      }
    }
    return returnedStates;
  }
  async fetchNftData(nonFungibleResourceAddress, nonFungibleLocalIds, fetchOptions) {
    let nftIdCount = nonFungibleLocalIds.length;
    if (nftIdCount === 0)
      return [];
    const fetchedNftData = [];
    const loadedIds = /* @__PURE__ */ new Set();
    while (nftIdCount > 0) {
      const returnedResult = [];
      const nb = Math.min(99, nftIdCount);
      nftIdCount -= nb;
      const idsToLoad = nonFungibleLocalIds.slice(nftIdCount, nftIdCount + nb).filter((id) => !loadedIds.has(id));
      if (idsToLoad.length === 0)
        continue;
      const fetchResult = await this.stateApi.nonFungibleData({
        stateNonFungibleDataRequest: {
          at_ledger_state: fetchOptions?.ledgerStateSelector,
          resource_address: nonFungibleResourceAddress,
          non_fungible_ids: idsToLoad
        }
      });
      this.apiCallCount++;
      if (!fetchResult?.non_fungible_ids)
        return [];
      const tasks = fetchResult.non_fungible_ids.map(async (nftFetchResult) => {
        if (nftFetchResult.data === void 0) {
          return;
        }
        const nftRawData = nftFetchResult.data?.programmatic_json;
        const state = await this.fetchField(nftRawData);
        const res = {
          $entityAddress: nonFungibleResourceAddress,
          $nonFungibleId: nftFetchResult.non_fungible_id,
          $data: state
        };
        returnedResult.push(res);
        loadedIds.add(nftFetchResult.non_fungible_id);
      });
      await Promise.all(tasks);
      if (fetchOptions?.loadLocations ?? false) {
        const locations = await this.stateApi.nonFungibleLocation({
          stateNonFungibleLocationRequest: {
            at_ledger_state: fetchOptions?.ledgerStateSelector,
            resource_address: nonFungibleResourceAddress,
            non_fungible_ids: idsToLoad
          }
        });
        this.apiCallCount++;
        locations.non_fungible_ids.forEach((location) => {
          const indexes = findIndexes(returnedResult, (nftData) => nftData.$nonFungibleId === location.non_fungible_id);
          indexes.forEach((index) => {
            returnedResult[index].$owningVault = location.owning_vault_address;
            returnedResult[index].$owningVaultParent = location.owning_vault_parent_ancestor_address;
            returnedResult[index].$owningVaultAncestor = location.owning_vault_global_ancestor_address;
          });
        });
      }
      returnedResult.forEach((nftData) => {
        fetchedNftData.push(nftData);
      });
    }
    return fetchedNftData;
  }
  async fetchResourceState(entityAddressesInput, fetchOptions) {
    let returnedStates = [];
    const entityAddresses = [...new Set(entityAddressesInput)];
    const batchSize = 20;
    let batch = [];
    for (let i = 0; i < entityAddresses.length; i += batchSize) {
      batch = entityAddresses.slice(i, i + batchSize);
      const result = await this.stateApi.stateEntityDetails({
        stateEntityDetailsRequest: {
          at_ledger_state: fetchOptions?.ledgerStateSelector,
          addresses: batch,
          aggregation_level: "Global",
          opt_ins: {
            native_resource_details: true
          }
        }
      });
      this.apiCallCount++;
      if (result.items.length === 0)
        return [];
      const tasks = result.items.map(async (resourceState) => {
        let v;
        if (resourceState.details?.type === "FungibleResource") {
          v = {
            $type: resourceState.details?.type,
            $entityAddress: resourceState.address,
            $metadata: {},
            $details: resourceState.details
          };
        }
        if (resourceState.details?.type === "NonFungibleResource") {
          v = {
            $type: resourceState.details?.type,
            $entityAddress: resourceState.address,
            $metadata: {},
            $details: resourceState.details
          };
        }
        if (v === void 0)
          return;
        this.resourceStateCache[resourceState.address] = v;
        resourceState.metadata.items.forEach(async (item) => {
          v.$metadata[toCamelCase(item.key)] = item.value.typed?.value ?? item.value.typed?.values;
        });
        return v;
      });
      const taskResult = await Promise.all(tasks);
      returnedStates = returnedStates.concat(taskResult.filter((item) => item !== void 0));
    }
    return returnedStates;
  }
  fetchField(field) {
    let value;
    if (field === void 0)
      return value;
    switch (field.kind) {
      case "Reference":
      case "Bool":
      case "String":
      case "NonFungibleLocalId": {
        value = field.value;
        break;
      }
      case "U8":
      case "I8":
      case "U16":
      case "I16":
      case "U32":
      case "I32":
      case "U64":
      case "I64":
      case "U128":
      case "I128": {
        value = Number.parseInt(field.value);
        break;
      }
      case "Decimal": {
        value = dec(field.value);
        break;
      }
      case "PreciseDecimal": {
        value = dec(field.value);
        break;
      }
      case "Map": {
        const tempMap = {};
        field.entries.forEach((entry) => {
          const [key, val] = [this.fetchField(entry.key), this.fetchField(entry.value)];
          tempMap[key] = val;
        });
        value = tempMap;
        break;
      }
      case "Array": {
        const tempArray = [];
        field.elements.forEach((entry) => tempArray.push(this.fetchField(entry)));
        value = tempArray;
        break;
      }
      case "Enum": {
        const enumPlugin = this.enumPlugins.reverse().find((plugin) => {
          if (field.type_name === void 0 || field.type_name === null)
            return void 0;
          else
            return plugin.enumName.includes(field.type_name);
        });
        if (enumPlugin) {
          value = enumPlugin.parser(field, this);
        } else {
          if (field.fields.length > 0) {
            value = {
              variantId: field.variant_id,
              variantName: field.variant_name,
              value: field.fields.length === 1 ? this.fetchField(field.fields[0]) : field.fields.map((v) => this.fetchField(v))
            };
          } else {
            value = { variantId: field.variant_id, variantName: field.variant_name };
          }
        }
        break;
      }
      case "Tuple": {
        if (field.fields.length === 0) {
          value = {};
          break;
        }
        const values = {};
        field.fields.forEach((subField, index) => {
          const key = subField.field_name ? toCamelCase(subField.field_name) : `_unnamedField${index}`;
          values[key] = this.fetchField(subField);
        });
        const tuplePlugin = this.tuplePlugins.reverse().find((plugin) => plugin.tupleName === field.type_name);
        value = tuplePlugin ? tuplePlugin.parser(values, this) : values;
        break;
      }
      case "Own": {
        if (field.type_name === "Vault" || field.type_name === "FungibleVault" || field.type_name === "NonFungibleVault") {
          value = field.value;
        } else if (field.type_name === "KeyValueStore") {
          value = new KeyValueStore(field.value, this);
        } else {
          value = new ComponentState(field.value, this);
        }
        break;
      }
      default: {
        value = field;
        break;
      }
    }
    return value;
  }
};

// src/base-model.ts
var BaseModel = class {
  constructor(stateFetcher) {
    this.stateFetcher = stateFetcher ?? new EntityStateFetcher(import_babylon_gateway_api_sdk.GatewayApiClient.initialize({
      basePath: "https://mainnet.radixdlt.com",
      applicationName: "Weft State Fetcher",
      headers: {
        "User-Agent": "WeftFinance"
      }
    }));
  }
};
var EntityStateModel = class extends BaseModel {
  constructor(entityAddress, stateFetcher) {
    super(stateFetcher);
    this.initialized = false;
    this.innerState = EntityStateFetcher.newBaseState(entityAddress, this.stateFetcher);
  }
  async init() {
    if (!this.innerState.$entityAddress)
      return;
    this.innerState = (await this.stateFetcher.fetchEntityState([this.innerState.$entityAddress]))[0];
  }
  get state() {
    return this.innerState.$state;
  }
};
var NonFungibleDataModel = class extends BaseModel {
  constructor(entityAddress, nonFungibleId, stateFetcher) {
    super(stateFetcher);
    this.initialized = false;
    this.innerData = {
      $entityAddress: entityAddress,
      $nonFungibleId: nonFungibleId,
      $data: void 0
    };
  }
  async init() {
    if (!this.innerData.$entityAddress)
      return;
    this.innerData = (await this.stateFetcher.fetchNftData(this.innerData.$entityAddress, [this.innerData.$nonFungibleId]))[0];
  }
  get data() {
    return this.innerData.$data;
  }
};
var ResourceDetailsRepo = class extends BaseModel {
  constructor(stateFetcher, ledgerStateSelector) {
    super(stateFetcher);
    this.resources = {};
    this.ledgerStateSelector = ledgerStateSelector;
  }
  async fetchResourceState(entityAddressesInput) {
    const addresses = entityAddressesInput.filter((address) => this.resources[address] === void 0);
    if (addresses.length > 1) {
      const res = await this.stateFetcher.fetchResourceState(entityAddressesInput, { ledgerStateSelector: this.ledgerStateSelector });
      res.forEach((resourceDetails) => {
        this.resources[resourceDetails.$entityAddress] = resourceDetails;
      });
    }
  }
};

// src/metadata-service.ts
var InMemoryCacheStrategy = class {
  constructor() {
    this.cache = /* @__PURE__ */ new Map();
  }
  get(key) {
    return this.cache.get(key);
  }
  set(key, value) {
    this.cache.set(key, value);
  }
  has(key) {
    return this.cache.has(key);
  }
  clear() {
    this.cache.clear();
  }
};
var LocalStorageCacheStrategy = class {
  constructor(ttlMs = 36e5) {
    this.prefix = "weft_metadata_";
    this.ttl = ttlMs;
  }
  get(key) {
    if (typeof localStorage === "undefined")
      return void 0;
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (!item)
        return void 0;
      const parsed = JSON.parse(item);
      if (Date.now() > parsed.expiry) {
        localStorage.removeItem(this.prefix + key);
        return void 0;
      }
      return parsed.value;
    } catch {
      return void 0;
    }
  }
  set(key, value) {
    if (typeof localStorage === "undefined")
      return;
    try {
      const item = {
        value,
        expiry: Date.now() + this.ttl
      };
      localStorage.setItem(this.prefix + key, JSON.stringify(item));
    } catch {
    }
  }
  has(key) {
    return this.get(key) !== void 0;
  }
  clear() {
    if (typeof localStorage === "undefined")
      return;
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }
      for (const key of keysToRemove) {
        localStorage.removeItem(key);
      }
    } catch {
    }
  }
};
var MetadataService = class extends BaseModel {
  constructor(stateFetcher, useLocalStorage = false, ttlMs) {
    super(stateFetcher);
    this.resourceInfoState = /* @__PURE__ */ new Map();
    this.validatorMetadataCache = /* @__PURE__ */ new Map();
    this.cacheStrategy = useLocalStorage ? new LocalStorageCacheStrategy(ttlMs) : new InMemoryCacheStrategy();
  }
  async getResourceDetails(resources, ledgerStateSelector) {
    const entityAddresses = [...new Set(resources)];
    const returnedResult = [];
    const resourcesToFetch = [];
    for (const address of entityAddresses) {
      const cached = this.cacheStrategy.get(address);
      if (cached) {
        returnedResult.push(cached);
      } else {
        resourcesToFetch.push(address);
      }
    }
    if (resourcesToFetch.length === 0) {
      return returnedResult;
    }
    const batchSize = 20;
    const batches = [];
    for (let i = 0; i < resourcesToFetch.length; i += batchSize) {
      batches.push(resourcesToFetch.slice(i, i + batchSize));
    }
    const results = await Promise.all(
      batches.map(
        (batch) => this.stateFetcher.stateApi.stateEntityDetails({
          stateEntityDetailsRequest: {
            at_ledger_state: ledgerStateSelector,
            addresses: batch,
            aggregation_level: "Global",
            opt_ins: {
              native_resource_details: true
            }
          }
        })
      )
    );
    this.stateFetcher.apiCallCount += batches.length;
    for (const result of results) {
      for (const resourceState of result.items) {
        if (resourceState.details?.type === "FungibleResource" || resourceState.details?.type === "NonFungibleResource") {
          const metadata = {};
          resourceState.metadata.items.forEach(async (item) => {
            metadata[toCamelCase(item.key)] = item.value.typed?.value ?? item.value.typed?.values;
          });
          const resourceInfo = {
            ...resourceState.details,
            resourceAddress: resourceState.address,
            metadata
          };
          this.resourceInfoState.set(resourceState.address, resourceInfo);
          returnedResult.push(resourceInfo);
        }
      }
    }
    const allValidatorAddressesSet = /* @__PURE__ */ new Set();
    const validatorAddressesToFetch = /* @__PURE__ */ new Set();
    returnedResult.forEach((r) => {
      if (r.native_resource_details?.kind === "ValidatorClaimNft" || r.native_resource_details?.kind === "ValidatorLiquidStakeUnit") {
        const validatorAddress = r.native_resource_details.validator_address;
        allValidatorAddressesSet.add(validatorAddress);
        if (this.validatorMetadataCache.has(validatorAddress)) {
          r.validatorMetadata = this.validatorMetadataCache.get(validatorAddress);
        } else {
          validatorAddressesToFetch.add(validatorAddress);
        }
      }
    });
    if (validatorAddressesToFetch.size > 0) {
      const res = await this.stateFetcher.fetchEntityState([...validatorAddressesToFetch], {
        loadState: true,
        loadResourceDetails: false,
        recursiveFungibleResourceLoading: false,
        recursiveNonFungibleResourceLoading: false
      });
      res.forEach((state) => {
        this.validatorMetadataCache.set(state.$entityAddress, state.$metadata);
        returnedResult.forEach((resource) => {
          if ((resource.native_resource_details?.kind === "ValidatorLiquidStakeUnit" || resource.native_resource_details?.kind === "ValidatorClaimNft") && resource.native_resource_details?.validator_address === state.$entityAddress) {
            resource.validatorMetadata = state.$metadata;
          }
        });
      });
    }
    for (const address of resourcesToFetch) {
      const resource = returnedResult.find((r) => r.resourceAddress === address);
      if (resource) {
        this.cacheStrategy.set(address, resource);
      }
    }
    return returnedResult;
  }
  /**
   * Get a single resource from cache or state
   */
  getResourceFromCache(resourceAddress) {
    return this.resourceInfoState.get(resourceAddress) ?? this.cacheStrategy.get(resourceAddress);
  }
  /**
   * Clear all cached resources and validator metadata
   */
  clearCache() {
    this.resourceInfoState.clear();
    this.cacheStrategy.clear();
    this.validatorMetadataCache.clear();
  }
  /**
   * Get all resources from state
   */
  getAllResourcesFromState() {
    return Array.from(this.resourceInfoState.values());
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BaseModel,
  ComponentState,
  EntityStateFetcher,
  EntityStateModel,
  FungibleResourceCollectionState,
  KeyValueStore,
  MetadataService,
  NonFungibleDataModel,
  NonFungibleResourceCollectionState,
  ONE,
  ONE_HUNDRED,
  PRECISE_ONE,
  PRECISE_ONE_HUNDRED,
  PRECISE_ZERO,
  ResourceDetailsRepo,
  ZERO,
  dec,
  findIndexes,
  optionTransformPlugin,
  toCamelCase
});
