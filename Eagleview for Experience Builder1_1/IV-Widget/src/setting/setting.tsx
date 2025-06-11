/* eslint-disable */
/** @jsx jsx */
/**
  Licensing

  Copyright 2022 Esri

  Licensed under the Apache License, Version 2.0 (the "License"); You
  may not use this file except in compliance with the License. You may
  obtain a copy of the License at
  http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
  implied. See the License for the specific language governing
  permissions and limitations under the License.

  A copy of the license is available in the repository's
  LICENSE file.
*/
import { React, css, jsx } from "jimu-core";
import { AllWidgetSettingProps } from "jimu-for-builder";
import {
  MapWidgetSelector,
  SettingSection,
  SettingRow,
} from "jimu-ui/advanced/setting-components";
import { TextInput } from "jimu-ui";
import { IMConfig, InitialState } from "../config";

const CheckMark = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M9.00012 1.5C4.86012 1.5 1.50012 4.86 1.50012 9C1.50012 13.14 4.86012 16.5 9.00012 16.5C13.1401 16.5 16.5001 13.14 16.5001 9C16.5001 4.86 13.1401 1.5 9.00012 1.5ZM9.00012 15C5.69262 15 3.00012 12.3075 3.00012 9C3.00012 5.6925 5.69262 3 9.00012 3C12.3076 3 15.0001 5.6925 15.0001 9C15.0001 12.3075 12.3076 15 9.00012 15Z"
      fill="#009AC5"
    />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M12.5305 6.53033C12.8233 6.82322 12.8233 7.2981 12.5305 7.59099L8.25012 11.8713L5.84479 9.46599C5.5519 9.1731 5.5519 8.69822 5.84479 8.40533C6.13769 8.11244 6.61256 8.11244 6.90545 8.40533L8.25012 9.75L11.4698 6.53033C11.7627 6.23744 12.2376 6.23744 12.5305 6.53033Z"
      fill="#009AC5"
    />
  </svg>
);

// const EV_API_URL = "https://apicenter.cmh.platform-test.evinternal.com/oauth2/v1/token";
// const EV_API_URL = "https://apicenter.cmh.platform-stage.evinternal.com/oauth2/v1/token";
const EV_API_URL = "https://apicenter.eagleview.com/oauth2/v1/token";

export const CheckAPIKey = (APIKEY): Promise<{status: number}> => {
  return new Promise((resolve, reject) => {
    fetch(EV_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        APIKEY: APIKEY,
      },
      body: new URLSearchParams({ grant_type: "client_credentials" }),
    })
      .then((data) => resolve(data))
      .catch((err) => reject(err));
  });
};

const getLonLatString = (view: any): string => {
  if (!view) return "";
  return `${view.lonLat.lat}, ${view.lonLat.lon}`;
}

export const validateLatLong = (queryString) => {
  const latLongRegex = /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)\s*[,\s]\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/;
  if (!latLongRegex.test(queryString)) return true;
  else return false;
};

export default class Setting extends React.PureComponent<
  AllWidgetSettingProps<IMConfig>,
  any
> {
  readonly state : InitialState= {
    APIKeyError: false,
    latLongError: false,
    APISuccess: false,
    latLongSuccess: false,
    apiKey: this.props.config.apiKey || "",
    view: getLonLatString(this.props.config.view),
  };
  

  onMapWidgetSelected = (useMapWidgetIds: string[]) => {
    this.props.onSettingChange({
      id: this.props.id,
      useMapWidgetIds: useMapWidgetIds,
    });
  };
  

  handleAPIKeyCheck = async (APIKEY: String) => {
    if (!APIKEY) return;
    this.setState({ APISuccess: false });
    try {
      const response = await CheckAPIKey(APIKEY)
      if (response?.status !== 200)
        this.setState({ APIKeyError: true, APISuccess: false });
      else {
        this.setState({ APIKeyError: false, APISuccess: true, apiKey: APIKEY });
        this.props.onSettingChange({
        id: this.props.id,
        config: this.props.config.set("apiKey", APIKEY),
      });
    }
    } catch (error) {
      this.setState({ APIKeyError: true, APISuccess: false });
    } 
  };

  handleLatLongCheck = (latLong: String) => {
    if (!latLong) return;
    this.setState({ latLongSuccess: false });
    const isInvalidInput = validateLatLong(latLong);
    if (isInvalidInput)
      this.setState({ latLongError: true, latLongSuccess: false });
    else {
      this.setState({ latLongError: false, latLongSuccess: true });
      const [lat,lon] = latLong.split(/[ ,]+/);
      const lonLat = {lat: Number(lat),lon: Number(lon)};
      const view = { lonLat }
      this.props.onSettingChange({
        id: this.props.id,
        config: this.props.config.set("view", view),
      })
    }
  };

  handleOnChange = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  }

  render() {
    const style = css`
      .widget-setting-iv {
        .header {
          color: var(--neutral-charcoal-400, #c8cdd7);
          font-size: 14px;
          font-style: normal;
          font-weight: 600;
          line-height: 20.987px; /* 149.904% */
        }
        .caption {
          color: var(--neutral-charcoal-500, #b4bac7);
          font-size: 11px;
          font-style: normal;
          font-weight: 400;
          line-height: 20.987px; /* 190.787% */
        }
        .mb-14 {
          margin-bottom: 14px;
        }
        .w-100 {
          width: 100%;
        }
        .helper-text {
          color: red;
          float: left;
          margin-top: 2px;
        }
        .red-border {
          border: 1px solid red;
        }
        .input {
          height: 31px;
          border-radius: 2px;
          background: #181818;
          border: none;
          color: var(--neutral-nickel-100, #f6f7ff);
          font-size: 12px;
          font-style: normal;
          font-weight: 400;
          line-height: 18px; /* 150% */
        }
      }
    `;
    return (
      <div css={style}>
        <div className="widget-setting-iv">
          <SettingSection title={<span className="header">API Key</span>}>
            <SettingRow>
              <div className="w-100">
                <span className="caption mb-14">
                  API keys can be accessed from the{" "}
                  <a target="blank" href="https://developer.eagleview.com/">
                    Eagleview developer center
                  </a>
                </span>

                <TextInput
                  className={this.state.APIKeyError && "red-border"}
                  onAcceptValue={(val) => this.handleAPIKeyCheck(val)}
                  onFocus={() => this.setState({ APIKeyError: false })}
                  placeholder="Enter API Key"
                  suffix={this.state.APISuccess && <CheckMark />}
                  onChange={this.handleOnChange}
                  value={this.state.apiKey}
                  type="password"
                  name="apiKey"
                />
                {this.state.APIKeyError && (
                  <label className="helper-text"> Invalid API key </label>
                )}
              </div>
            </SettingRow>
          </SettingSection>
          <SettingSection
            title={<span className="header">Starting Location</span>}
          >
            <SettingRow>
              <div className="w-100">
                <label className="caption mb-14">
                  Optional, overwrite starting location for EagleView Imagery
                </label>

                <TextInput
                  className={this.state.latLongError && "red-border"}
                  onAcceptValue={(val) => this.handleLatLongCheck(val)}
                  placeholder="Enter Lat,Long"
                  onFocus={() => this.setState({ latLongError: false })}
                  suffix={this.state.latLongSuccess && <CheckMark />}
                  onChange={this.handleOnChange}
                  value={this.state.view}
                  name="view"
                />
                {this.state.latLongError && (
                  <label className="helper-text">
                    {" "}
                    Invalid starting location{" "}
                  </label>
                )}
              </div>
            </SettingRow>
          </SettingSection>
          <SettingSection
            title={<span className="header">Auto-synchronize map</span>}
          >
            <SettingRow>
              <div className="w-100">
                <label className="caption mb-14">
                  Optional, synchronize EagleView Imagery to the
                  selected map below
                </label>

                <MapWidgetSelector
                  onSelect={this.onMapWidgetSelected}
                  useMapWidgetIds={this.props.useMapWidgetIds}
                />
              </div>
            </SettingRow>
          </SettingSection>
        </div>
      </div>
    );
  }
}
