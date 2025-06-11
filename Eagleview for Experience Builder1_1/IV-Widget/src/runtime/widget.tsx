import { type JimuMapView, JimuMapViewComponent } from 'jimu-arcgis'
import { React, ReactDOM, type AllWidgetProps } from 'jimu-core'
import { type IMConfig, type Map } from '../config'
import { Icon } from 'jimu-ui'
import { debounce } from 'lodash-es'

const ErrorIcon = require('./assets/Erroricon.svg')

const ErrorComponent = () => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#4D5365', height: '500px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Icon
          icon={ErrorIcon}
          size="70"
          title="Icon"
        />
        <div style={{ color: '#FFFFFF', paddingLeft: '10px' }}>
          <p style={{ fontSize: '20px', fontWeight: '700', marginBottom: 0 }}>Failed to load integrated viewer</p>
          <span>Please contact EagleView customer support for assistance</span>
        </div>
      </div>
    </div>
  )
}

const Widget = (props: AllWidgetProps<IMConfig>) => {
  const { useState, useEffect, useRef } = React
  const [showErrorScreen, setShowError] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const map = useRef<Map>()
  const jmvref = useRef<JimuMapView>()
  const viewUpdateTimeout = useRef(null)
  const { config: { view, apiKey, exbWidgetVersion } } = props
  const extentWatcher = useRef(null)
  /* This is to prevent the first event from triggering the view update for IV widget */
  const isFirstEventTriggerdRef = useRef(false)
  const isProgrammaticExtentChange = useRef(false)

  const addScript = (src, onLoad = () => null, onError = () => null, isIVScript = false) => {
    const script = document.createElement('script')
    if (isIVScript) {
      script.onload = function () {
        onloadIV()
      }
    }
    script.src = src
    script.defer = true
    script.onerror = onError
    document.head.appendChild(script)
  }

  const handleMouseDown = () => {
    setIsDragging(true)
  }

  const handleMouseMove = (e) => {
    if (isDragging) {
      isProgrammaticExtentChange.current = false
    }
  }

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false)
      isProgrammaticExtentChange.current = false
    }
  }

  const jimuExtentEventHandler = debounce((evt) => {
    if (jmvref.current.view.center) {
      if (!isFirstEventTriggerdRef.current) isFirstEventTriggerdRef.current = true
      const lat = Number(jmvref.current.view.center.latitude.toFixed(5))
      const lon = Number(jmvref.current.view.center.longitude.toFixed(5))
      isProgrammaticExtentChange.current = true
      map.current?.setView(
        {
          lonLat: { lat, lon },
          zoom: jmvref.current.view.zoom
        }
      )
    }
  }, 300)

  const handleOnViewUpdate = (view) => {
    if (!isFirstEventTriggerdRef.current) return
    if (viewUpdateTimeout.current) clearTimeout(viewUpdateTimeout.current)
    viewUpdateTimeout.current = setTimeout(() => {
      if (extentWatcher.current) extentWatcher.current.remove()
      if (isProgrammaticExtentChange.current) {
        extentWatcher.current = jmvref.current.view.watch('extent', jimuExtentEventHandler)
        return
      }
      jmvref.current?.view.goTo({
        center: [view.lonLat.lon, view.lonLat.lat],
        zoom: view.zoom
      }).then((res) => {
        extentWatcher.current = jmvref.current.view.watch('extent', jimuExtentEventHandler)
      })
    }, 500)
  }

  const onloadIV = () => {
    if (window.ev) {
      const evIntegratedViewer = new window.ev.IntegratedViewer()
      let IVProps: IMConfig = { appIdentifier: 'EXB_IE', exbWidgetVersion }
      if (apiKey) {
        IVProps = { ...IVProps, apiKey, authToken: localStorage.getItem('token') }
      }
      if (view?.lonLat) {
        IVProps = { ...IVProps, view }
      }
      map.current = evIntegratedViewer.mount('ivroot', IVProps)
      map.current.on('onViewUpdate', handleOnViewUpdate)
    } else {
      // Show error screen
    }
  }

  const onloadIVFailed = (...args) => {
    console.log(...args)
    setShowError(true)
  }

  // const ivURL = 'https://embedded-explorer.cmh.platform-test2.evinternal.com/static/embedded-explorer-widget-exb.js'
  // const ivURL = 'https://embedded-explorer.cmh.platform-stage2.evinternal.com/static/embedded-explorer-widget-exb.js'
  const ivURL = 'https://embedded-explorer.eagleview.com/static/embedded-explorer-widget-exb.js'
  useEffect(() => {
    window.React = React
    window.ReactDOM = ReactDOM
    addScript(ivURL, onloadIV, onloadIVFailed, true)
  }, [])

  const activeViewChangeHandler = (jmv: JimuMapView) => {
    jmvref.current = jmv
    if (jmv) {
      extentWatcher.current = jmv.view.watch('extent', jimuExtentEventHandler)

      jmv.view.on('pointer-down', evt => {
        console.log('pointer down ', evt)
      })
    }
  }

  return (
    <div>
      {showErrorScreen
        ? (
            <ErrorComponent />
          )
        : (
        <div>
          {props.useMapWidgetIds && props.useMapWidgetIds.length === 1 && (
            <JimuMapViewComponent
              useMapWidgetId={props.useMapWidgetIds?.[0]}
              onActiveViewChange={(jmv: JimuMapView) => { activeViewChangeHandler(jmv) }}
            />
          )}
          <div id="ivroot" style={{ height: '1200px' }} onMouseUp={handleMouseUp} onMouseMove={handleMouseMove} onMouseDown={handleMouseDown}></div>
        </div>
          )}
    </div>
  )
}

export default Widget
