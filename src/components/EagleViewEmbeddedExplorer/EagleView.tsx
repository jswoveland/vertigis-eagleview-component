/* eslint-disable no-void */

/*

    // map control buttons. I've moved these because they don't seem necessary
    <div>
        <ButtonGroup className="third-party-map-controls" size="small">
            <IconButton
                onClick={ONRECENTER}
                title={"language-eagleview-recenter-title"}
            >
                <CenterMap />
            </IconButton>

            <IconButton
                onClick={ONCLOSE}
                title={"language-eagleview-close-title"}
            >
                <Close />
            </IconButton>
        </ButtonGroup>
    </div>

*/
import type { LayoutElementProperties } from "@vertigis/web/components";
import { LayoutElement } from "@vertigis/web/components";
import { UIContext } from "@vertigis/web/ui";
import React, { useEffect, useState, useRef, useContext } from "react";
import ReactDOM from "react-dom";

import "./EagleView.css";
import type { EagleViewModel } from ".";
import { ViewUpdatedEventSource } from "./EagleViewModel";

// Required to attached initMap function to window.
declare global {
    interface Window { initMap: any; PictometryHost: any; ev: any }
}

export default function EagleView(props: LayoutElementProperties<EagleViewModel>): React.ReactElement {

    const { hostElement } = useContext(UIContext)
    const rootRef = useRef<HTMLDivElement>();
    const { model } = props;
    const ONRECENTER = () => void model.Recenter();
    const ONCLOSE = () => void model.Close(model);
    const [isDragging, setIsDragging] = useState(false);
    const ev = useRef<any>();

    // const [scriptLoaded, setScriptLoaded] = useState(false);
    // const [scriptDOMloaded, setScriptDOMLoaded] = useState(false);
    // const [loaded, setLoaded] = useState(false);

    const createScript = (url) => {
        console.log("Creating Script");

        const s = hostElement.ownerDocument.createElement("script");
        s.id = "embedded-explorer-widget";
        s.src = url;
        s.type = "application/javascript";
        s.crossOrigin = "anonymous|use-credentials";
        s.async = true;
        return s;
    };

    useEffect(() => {
        console.log("EagleView.tsx useEffect()");

        const evScriptElt = hostElement.ownerDocument.getElementById("embedded-explorer-widget");
        const window = hostElement.ownerDocument.defaultView as any;

        if (evScriptElt == null) {
            if (window.define == null) {
                window["React"] = React;
                window["ReactDOM"] = ReactDOM;
                window["react-virtualized"] = undefined;
                window["recharts"] = undefined;
            }
            else {
                // This is required to get the EagleView script running.
                window.define("React", React);
                window.define("ReactDOM", ReactDOM);
                window.define("react-virtualized", undefined);
                window.define("recharts", undefined);
            }

            const embedded_explorer_script = createScript(
                "https://embedded-explorer.eagleview.com/static/embedded-explorer-widget.js"
            );

            //We need to force the necessary modules to load 
            embedded_explorer_script.onload = () => {
                if (window.require) {
                    window.require(["lib"], () => {
                        void initEmbeddedExplorer();
                    })
                } else {
                    void initEmbeddedExplorer()
                }
            };

            hostElement.ownerDocument.body.appendChild(embedded_explorer_script);
        }
        else {
            void initEmbeddedExplorer();
        }
        // else {
        //     (window as any).require(["lib"], () => {
        //         void initEmbeddedExplorer();
        //     })
        // }
    });


    const initEmbeddedExplorer = async () => {
        const center = await model.MercatorizePoint(model.map.view.center);
        const rotation = model.map.view.viewpoint.rotation;
        const zoom = model.map.view.zoom - 1;
        const view = { lonLat: { lat: center.latitude, lon: center.longitude }, rotation, zoom };

        const widget = hostElement.ownerDocument.getElementById("eagle-view-map");
        if (widget == null) {
            const container = hostElement.ownerDocument.createElement("div");
            container.setAttribute("id", "eagle-view-map");
            rootRef.current.appendChild(container);
        }
        if (ev.current != null) {
            ev.current.destroy();
        }

        ev.current = new hostElement.ownerDocument.defaultView.ev.EmbeddedExplorer();
        model.e3 = ev.current.mount("eagle-view-map", { apiKey: model.apiKey, view });
    };

    const handleMouseDown = () => {
        //   setIsDragging(true)
    }

    const handleMouseMove = (e) => {
        if (isDragging) {
            // isProgrammaticExtentChange.current = false
        }
    }

    const handleMouseUp = () => {
        //if (isDragging) {
        //  setIsDragging(false)
        if (model) {
            model.mapUpdateEventSource = ViewUpdatedEventSource.e3;
        }
        //}
    };

    return (
        <LayoutElement {...props} stretch>
            <div ref={rootRef} onMouseUp={handleMouseUp} onMouseMove={handleMouseMove} onMouseDown={handleMouseDown} onWheel={handleMouseUp} ></div>

        </LayoutElement>
    );
}