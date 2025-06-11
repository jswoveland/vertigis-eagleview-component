import { ImmutableObject } from 'seamless-immutable'

export interface InitialState {
  APIKeyError: boolean;
  latLongError: boolean;
  APISuccess: boolean;
  latLongSuccess: boolean;
  apiKey: string;
  view: string;
}

export interface Config {
  apiKey: string;
  view: Object;
  appIdentifier: string;
  exbWidgetVersion: string;
}

export interface Map {
  setView: Function
}

export type IMConfig = ImmutableObject<Config>
