/* eslint-disable accessor-pairs */
/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable no-void */

import Point from "@arcgis/core/geometry/Point";
import SpatialReference from "@arcgis/core/geometry/SpatialReference";
import * as apiGeometryUtils from "@vertigis/arcgis-extensions/utilities/geometry";
import type { MapModel } from "@vertigis/web/mapping";
import type {
    ComponentModelProperties,
    PropertyDefs
} from "@vertigis/web/models";
import {
    serializable,
    ComponentModelBase,
    importModel
} from "@vertigis/web/models";
import Viewpoint from "esri/Viewpoint";
import { debounce } from 'lodash-es'

interface EagleViewProperties extends ComponentModelProperties {
    apiKey?: string;
}

export enum ViewUpdatedEventSource {e3, VSW};

@serializable
export default class EagleViewModel extends ComponentModelBase<EagleViewProperties> {
    apiKey: string;
    currentMarkerPosition: { latitude: number; longitude: number };
    updating = false;
    panoramaStatus = false;
    
    mapUpdateEventSource = ViewUpdatedEventSource.VSW;

    private _setup = false;
    private readonly _awaitViewHandle: IHandle;
    // private readonly _viewerUpdateHandle: IHandle;
    private  _e3ViewUpdateHandle: IHandle;
    private _locationMarkerHandle: IHandle;
    private _VSWMapUpdateHandle: IHandle;
    private _VSMapPointerUpHandle: IHandle; 
    private _VSMapMouseWheelHandle: IHandle;
    private _curMarkerPoint: Point;

    private isFirstEventTriggeredRef = false; 
  

    /** 
     * Set/Get MapModel
     */
    private _map: MapModel | undefined;
    
    get map(): MapModel | undefined {
        return this._map;
    }
    @importModel("map-extension")
    set map(instance: MapModel | undefined) {
        console.log("EagleViewModel.setMap()");
        if (instance === this._map) {
            return;
        }
        // Clean up.
        if (this._map) {
            void this._CleanupMaps();
        }
        this._map = instance;
      //  this._CreateMarker(this._map.view.center);

        this._VSMapPointerUpHandle = this.map.view.on("pointer-up", (evt) => {
            this.mapUpdateEventSource = ViewUpdatedEventSource.VSW;
        });
        this._VSMapMouseWheelHandle = this.map.view.on("mouse-wheel", (evt) => {
            this.mapUpdateEventSource = ViewUpdatedEventSource.VSW;
        });
        
        this._VSWMapUpdateHandle = this.messages.events.map.viewpointChanged.subscribe(this.onVSWMapExtentUpdated);
    }

    /** 
     * Set/Get Eagleview embedded viewer
     */
    private _e3: any | undefined;
    get e3(): any | undefined {
        return this._e3;
    }

    set e3(instance: any | undefined) {
        if(instance === this._e3) {
            return;
        }
        // this._viewerUpdateHandle?.remove();
        // If an instance already exists, clean it up first.
        if (this._e3) {
            // do clean up...
            // https://embedded-explorer.eagleview.com/static/docs/module-Embedded-Explorer-API.html#.off
            this._e3.off("onViewUpdate");
        }
        this._e3 = instance;
        this._e3.on("onMapReady", () =>{
            this._e3.off("onViewUpdate");
            this._e3ViewUpdateHandle = this._e3.on("onViewUpdate", this.onE3ViewUpdated);
        });
    }
    
    /**
     * Update Eagleview component with new coordinates
     */
    // eslint-disable-next-line @typescript-eslint/member-ordering
    async UpdateEVView(position: Point, zoom: number, rotation = 0 ): Promise<void> {
        if(!this.e3) {
            return;
        }
        const pos = await this.MercatorizePoint(position);
        // remove eV onViewUpdate handler
        this.e3.off("onViewUpdate");
       // this._e3ViewUpdateHandle.remove();
        void this.e3.setView(
            { lonLat: {
                lat: pos.latitude,
                lon: pos.longitude            
              },
              zoom: zoom,
              rotation: rotation
            },
            ()=>{
                this._e3ViewUpdateHandle = this._e3.on("onViewUpdate", this.onE3ViewUpdated);
            });
    }

   /**
     * @param updatedView 
     * @returns 
     */    
    private readonly onE3ViewUpdated = (updatedView) => {
        console.log("EagleViewModel: onViewUpdate()");

        // if e3 wasn't the ViewUpdatedEventSource, ignore this./
        // this would be the case if the view updated event was triggered by 
        // the VSW map being updated.        
        if(this.mapUpdateEventSource !== ViewUpdatedEventSource.e3) {
            return;
        }
        const point = new Point({ x: updatedView.lonLat.lon, y: updatedView.lonLat.lat, spatialReference: new SpatialReference({wkid: 4326}) });
        
        // need to convert the zoom level to map scale
        // Eagleview appears to use MapBox tile schema, so we need to add 1 to the zoom level
        const zoom = Math.round(updatedView.zoom + 1);
        const vswScale = (<any>this.map).scaleLevels.items[zoom];

       // const vswScale = this.map.view.
        this.UpdateVSWMap( new Viewpoint({
            targetGeometry: point,
            rotation: updatedView.rotation * -1,
            scale: vswScale
            }));
    }

    private readonly onVSWMapExtentUpdated = debounce((evt) => {
        if (this.map) {
            // if e3 wasn't the ViewUpdatedEventSource, ignore this./
            // this would be the case if the view updated event was triggered by 
            // the VSW map being updated.        
            if(this.mapUpdateEventSource !== ViewUpdatedEventSource.VSW) {
                return;
            }
            if (!this.isFirstEventTriggeredRef) {
                this.isFirstEventTriggeredRef = true;
            }

            // Eagleview appears to use MapBox tile schema, so we need to add 1 to the zoom level
           void this.UpdateEVView(this.map.view.center, this.map.view.zoom - 1, this.map.viewpoint.rotation *-1);
        }
    }, 100);


    // eslint-disable-next-line arrow-body-style
    private readonly UpdateVSWMap = (viewPoint: Viewpoint)  => {
        // remove VSW Map Listener
        if (this._VSWMapUpdateHandle) {
            this._VSWMapUpdateHandle.remove();
        }
        void this.ProjectPoint(<Point>viewPoint.targetGeometry).then((p) => {
            viewPoint.targetGeometry = p;
            void this.messages.commands.map.goToViewpoint.execute({
                viewpoint: viewPoint
            }).then(()=> {
                this._VSWMapUpdateHandle = this.messages.events.map.viewpointChanged.subscribe(this.onVSWMapExtentUpdated);
            });
        });
    }



    /**
     * Clean up map.
     */
    private  _CleanupMaps() {
        this._setup = false;
        //this.e3.off("onViewUpdate");
        if(this._VSMapMouseWheelHandle) 
            this._VSMapMouseWheelHandle.remove();
        if(this._VSMapPointerUpHandle)
            this._VSMapPointerUpHandle.remove();
        if(this._VSWMapUpdateHandle)
            this._VSWMapUpdateHandle.remove();
        if(this._e3ViewUpdateHandle)
            this._e3ViewUpdateHandle.remove();

       // await this._RemoveMarker();
    }

    /**
     * Create new marker.
     */
    private _CreateMarker(centerPoint: Point): void {
        this._curMarkerPoint = centerPoint;
        void this.messages.commands.locationMarker.create.execute({
            geometry: centerPoint,
            maps: this.map,
            id: this.id,
            userDraggable: true,
            symbol: "callout"
        });
        this._locationMarkerHandle = this.messages.events.locationMarker.updated.subscribe( (lme) =>{
            // https://developers.vertigisstudio.com/docs/web/api-argument-definitions/#definition-LocationMarkerEvent
            const pos = <Point>lme.geometry;
            this.mapUpdateEventSource = ViewUpdatedEventSource.VSW;
            // const rotation = lme.heading;
            void this.UpdateEVView(pos, this.map.view.zoom -1, this.map.viewpoint.rotation);
        });
    }
 
    /**
     * Remove marker.
     */
    private async _RemoveMarker(): Promise<void> {
        await this.messages.commands.locationMarker.remove.execute({
            id: this.id,
            maps: this.map,
        });
        if(this._locationMarkerHandle) {
            this._locationMarkerHandle.remove();
            this._locationMarkerHandle = null;
        } 
        this._curMarkerPoint = null;
    }

    /**
     * Zoom to marker.
     */
    private async _ZoomToMarker(centerPoint: Point): Promise<void> {
        this._curMarkerPoint = centerPoint;
        await this.messages.commands.map.zoomToViewpoint.execute({
            maps: this.map,
            viewpoint: {
                targetGeometry: centerPoint,
                scale: this.map.view.scale,
            }
        })
        .catch(err => (console.error(err.message)));
    }

    /**
     * Recenter viewer to marker location
     */
    async Recenter(): Promise<void> {
        this.updating = true;
        await this._ZoomToMarker(this._curMarkerPoint);
        await this.UpdateEVView(this._curMarkerPoint, this.map.view.zoom -1, this.map.viewpoint.rotation);
        this.updating = false;
    }

    /**
     * Close the Pictometry view component.
     */
    async Close(model: EagleViewModel): Promise<void> {
        this._CleanupMaps();
        await this.messages.commands.ui.deactivate.execute(model);

    }


    /**
     * Reprojects, if necessary, a point to the map's current spatial reference
     * @param position 
     * @returns position
     */
    async ProjectPoint(position: Point) : Promise<Point>{
        // first check to see if the point is in the same SR as the map. If not, we need to reproject it
        let pos = position;
        if(pos.spatialReference.wkid === this.map.spatialReference.wkid) {
            return pos;
        }
        // eslint-disable-next-line no-param-reassign
        const positionResults = await apiGeometryUtils.project(
            [position],
            this.map.spatialReference
        );
        pos = <Point>positionResults[0];
        return pos;
    }
    /**
     * Reprojects, if necessary, a point to Web Mercator
     * @param position 
     * @returns position, in Web Mercator
     */
    async MercatorizePoint(position: Point) : Promise<Point>{
        // first check to see if the point is in web mercator. If not, we need to reproject it
        let pos = position;
        if (!position.spatialReference.isWebMercator) {
            // eslint-disable-next-line no-param-reassign
            const positionResults = await apiGeometryUtils.project(
                [position],
                new SpatialReference({ wkid: 3857 })
            );
            pos = <Point>positionResults[0];
        }
        return pos;
    }


    // eslint-disable-next-line @typescript-eslint/member-ordering
    protected override _getSerializableProperties(): PropertyDefs<EagleViewProperties> {
        const props = super._getSerializableProperties();
        return {
            ...props,
            apiKey: {
                serializeModes: ["initial"],
                default: "",
            },
            title: {
                ...this._toPropertyDef(props.title),
                default: "language-web-incubator-view-title",
            },
            icon: {
                ...this._toPropertyDef(props.icon),
                default: "map-3rd-party",
            },
        };
    }

    protected override async _onDestroy(): Promise<void> {
        await super._onDestroy();       
        await this._RemoveMarker();
    }
    
}