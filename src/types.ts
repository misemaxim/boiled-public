import { createMapContext } from './public/elements/modules/mapping/lib/map-service';

export enum APP_MODULES {
  MAP = '/mapping',
  PLUGINS = '/plugins',
  SETTINGS = '/settings',
  LOGIN = '/login',
  PUBLIC = '/public'
}

export interface MapGroup {
  id: string;
  created: number;
  icon: string;
  name: string;
  color: string;
  properties: string[];
  plugins: string[];
}

export interface PointData {
  coordinates: [number, number];
  id: string;
  name: string;
  group: string;
  properties: string[];
  created: number;
}

export interface SessionSchema {
  groups: MapGroup[];
  points: Record<string, PointData[]>;
  geometry: string;
  measurements: string;
  arrows: string;
  name: string;
  plugins: string[];
}

export interface SessionSchemaDev extends Omit<SessionSchema, 'points'> {
  points: Record<string, (Omit<PointData, 'coordinates'> & { coordinates: number[] })[]>
}

export interface PluginSchema {
  id: string;
  type: string;
  body: string;
  name: string;
  description: string;
}

export type DeviceStorageItemEncrypted = {
  _id: string,
  data: string,
  timestamp: number
};

export type DeviceStorageItemDecrypted = {
  _id: string,
  data: {
    id: string,
    data: SessionSchema | PluginSchema[]
  },
  timestamp: number
};

export enum API_ROUTES {
  ICONS = '/api/icons',

  SESSION_GET = '/api/session/get',
  SESSION_DELETE = '/api/session/delete',
  SESSION_CREATE = '/api/session/create',
  SESSION_UPDATE = '/api/session/update',
  SESSION_DEFINTIONS = '/api/session/definitions',

  PLUGIN_GET = '/api/plugin/get',
  PLUGIN_DELETE = '/api/plugin/delete',
  PLUGIN_CREATE = '/api/plugin/create',
  PLUGIN_UPDATE = '/api/plugin/update',
  PLUGIN_DEFINTIONS = '/api/plugin/definitions',

  LOGIN = '/api/login',
  LOGOUT = '/api/logout',
  LOGIN_VALIDATE = '/api/login-validate',

  USER_PASSWORD_CHANGE = '/api/user/password-change',

  CONFIG_GET = '/api/config'
}

export type ServerStorageItem<T> = {
  _id: string;
  data: T;
  timestamp: number;
  _rev?: string;
  _deleted?: boolean;
};

export interface SessionDefinition {
  name: string;
  created: number;
}

export interface PluginDefinition {
  name: string;
  type: PluginTypes;
  created: number;
}

export interface Defintiion {
  name: string;
  created: number;
}

export enum LOG_TYPES {
  ERROR = 'error',
  WARNING = 'warning',
}

export type MapContext = ReturnType<typeof createMapContext>;

export enum PluginTypes {
  Coordinates = 'coordinates',
  Search = 'search',
  Point = 'point',
  Refresh = 'refresh'
}
export interface PluginSchemaRaw {
  type: PluginTypes,
  name: string,
  script: string
}
export enum USER_TYPES {
  SUPER = 'superuser',
  ADMIN = 'admin',
  CREATOR = 'creator',
}
export interface UserSchema {
  username: string;
  signature: string;
  type: USER_TYPES;
  salt: string;
  cookie?: {
    value: string;
    maxAge: number;
  }
}
export interface PluginEvaluationResponse {
  prompt?: {
    message: string,
    actionText: string,
    action: () => void
  },
  log?: string
}

export interface CustomLayer {
  name: string;
  url: string;
  attribution: string;
}

export interface AppConfig {
  layers: {
    enableDefault: boolean;
    enableSatellite: boolean;
    customLayers: CustomLayer[];
  };
  public: {
    enabled: boolean;
    sessionId: string;
    layers: CustomLayer[];
    message: string;
    metric: boolean;
  }
}

export enum API_ERRORS {
  USER_EXISTS = 'USER IS ALREADY CREATED',
  INVALID_USERNAME = 'INVALID USERNAME ON CREATION',
  INVALID_LOGIN = 'INVALID LOGIN',
  FORBIDDEN_OPERATION = 'FORBIDDEN OPERATION',
  PASSWORD_CHANGE_FAILED_CURRENT_PASSWORD = 'PASSWORD CHANGE FAILED: INVALID CURRENT PASSWORD',
  PASSWORD_CHANGE_FAILED_REPEAT_PASSWORD = 'PASSWORD CHANGE FAILED: INVALID REPEAT PASSWORD',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ByPass = any;

export type NullObject = Record<never, never>;
