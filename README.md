This project was bootstrapped with the [VertiGIS Studio Web SDK](https://github.com/vertigis/vertigis-web-sdk).

## First Steps - Scripts

### `npm install`

Downloads project dependencies. YOU MUST DO THIS PRIOR TO THE FOLLOWING.

### `npm start`

Runs the project in development mode. Open [http://localhost:3001](http://localhost:3001) to view it in the browser.

The page will automatically reload if you make changes to the code. You will see build errors and warnings in the console.

### `npm run build`

Builds the library for production to the `build` folder. It optimizes the build for the best performance.

Your custom library is now ready to be deployed!

## Next Steps

### Update EagleView API Key

Prior to running the app, you must update the EagleView API key set in the app/app.json file.
Open app/app.json and search for "apiKey", and update the value to an EagleView API that works for "http://localhost:3001/"

### To disable the ReactDevOverlay 
When running this project from the node server (npm start), any uncaught errors and warnings will, by default, be displayed in the ReactDevOverlay, which can be kind of annoying.
To disable this, navigate to node_modules\@vertigis\web-sdk\scripts\start.js, and insert the property `overlay: false` at line 34 (in the `client` object definition).



See the [section about deployment](https://developers.vertigis.com/docs/web/sdk-deployment/) in the [Developer Center](https://developers.vertigis.com/docs/web/overview/) for more information.

## Learn More

Find [further documentation on the SDK](https://developers.vertigis.com/docs/web/sdk-overview/) on the [VertiGIS Studio Developer Center](https://developers.vertigis.com/docs/web/overview/)
