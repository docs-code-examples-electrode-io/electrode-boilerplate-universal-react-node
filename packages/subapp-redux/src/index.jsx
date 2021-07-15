import React from "react";
import { render, hydrate } from "react-dom";
import { Provider } from "react-redux";
import { loadSubApp } from "subapp-web";
import { setStoreContainer, getReduxCreateStore } from "./shared";
export { hotReloadSubApp } from "subapp-web";

export { getReduxCreateStore } from "./shared";

setStoreContainer(window);

//
// client side function to start a subapp with redux support
//
export function reduxRenderStart(options) {
  const store = options._store || options.reduxCreateStore(options.initialState);
  const { Component } = options;

  if (!options.element) {
    return (
      <Provider store={store}>
        <Component />
      </Provider>
    );
  }

  if (options.serverSideRendering) {
    hydrate(
      <Provider store={store}>
        <Component />
      </Provider>,
      options.element
    );
  } else {
    render(
      <Provider store={store}>
        <Component />
      </Provider>,
      options.element
    );
  }

  return store;
}

//
// Load a subapp with redux support
// info - the subapp's information
// onLoadStartElement - the HTML element to render into upon loaded by the browser
//
export function reduxLoadSubApp(info) {
  const renderStart = function(instance, element) {
    const initialState = instance._prepared || instance.initialState;
    const reduxCreateStore = instance.reduxCreateStore || this.info.reduxCreateStore;
    const Component = this.info.StartComponent || this.info.Component;

    const store = reduxRenderStart({
      _store: instance._store,
      initialState,
      reduxCreateStore,
      Component,
      serverSideRendering: instance.serverSideRendering,
      element
    });

    instance._store = store;
    return store;
  };

  const extras = {
    __redux: true
  };

  if (!info.reduxCreateStore) {
    extras._genReduxCreateStore = "subapp";
  }

  return loadSubApp(
    Object.assign(extras, info, {
      reduxCreateStore: getReduxCreateStore(info)
    }),
    renderStart
  );
}
