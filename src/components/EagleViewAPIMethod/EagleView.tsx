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
import "./EagleView.css";
import ButtonGroup from "@vertigis/web/ui/ButtonGroup";
import IconButton from "@vertigis/web/ui/IconButton";
import CenterMap from "@vertigis/web/ui/icons/CenterMap";
import Close from "@vertigis/web/ui/icons/Close";
import React, { useEffect, useState, useRef, useMemo } from "react";
import ReactDOM from "react-dom";
import { EagleViewModel} from ".";
import {ViewUpdatedEventSource} from "./EagleViewModel";

// Required to attached initMap function to window.
declare global {
    interface Window { initMap: any; PictometryHost: any; ev: any }
}

export default function EagleView(props: LayoutElementProperties<EagleViewModel>): React.ReactElement {

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
        const s = document.createElement("script");
        s.id ="embedded-explorer-widget";
        s.src = url;
        s.type = "text/javascript";
        s.crossOrigin = "anonymous|use-credentials";
        s.async = true;
        return s;
    };

    useEffect(() => {
        console.log("EagleView.tsx useEffect()");

        const evScriptElt = document.getElementById("embedded-explorer-widget");

        if(evScriptElt == null) {
            // This is required to get the EagleView script running.
            (window as any).define("React", React);
            (window as any).define("ReactDOM", ReactDOM);
            (window as any).define("react-virtualized", undefined);
            (window as any).define("recharts", undefined);


            const embedded_explorer_script = createScript(
                "https://embedded-explorer.eagleview.com/static/embedded-explorer-widget.js"
            );

            //We need to force the necessary modules to load 
            embedded_explorer_script.onload = () => {
                (window as any).require(["lib"], () => {
                    void initEmbeddedExplorer();
                })
            };
            
            document.body.appendChild(embedded_explorer_script);
        }
        else {
            void initEmbeddedExplorer();
        }
        // else {
        //     (window as any).require(["lib"], () => {
        //         void initEmbeddedExplorer();
        //     })
        // }
    } );


    const initEmbeddedExplorer = async () => {
        const center = await model.MercatorizePoint(model.map.view.center);
        const rotation  = model.map.view.viewpoint.rotation;
        const zoom = model.map.view.zoom -1;
        const view = { lonLat: {lat: center.latitude, lon: center.longitude}, rotation, zoom };

        const widget = document.getElementById("eagle-view-map");
        if(widget == null) {
            const container = document.createElement("div");
            container.setAttribute("id", "eagle-view-map");
            rootRef.current.appendChild(container);
        }
        if(ev.current != null) {
            ev.current.destroy();
        }

        ev.current = new window.ev.EmbeddedExplorer();
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
          if(model) {
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