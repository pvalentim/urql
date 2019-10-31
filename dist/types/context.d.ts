/// <reference types="react" />
import { Client } from './client';
export declare const Context: import("react").Context<Client>;
export declare const Provider: import("react").ProviderExoticComponent<import("react").ProviderProps<Client>>;
export declare const Consumer: import("react").ExoticComponent<import("react").ConsumerProps<Client>>;
export declare const useClient: (overrideClient?: Client | undefined) => Client;
