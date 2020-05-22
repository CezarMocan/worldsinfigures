# proj.ections.net

## Initial setup

0. Make sure `node` and `npm` are installed and up to date. Running `node -v` should return something newer than `v10.0.0`. Running `npm -v` should return something newer than `6.0.0`. If that is not the case, follow the instructions [here](https://nodejs.org/en/download/package-manager/) to install `node` and `npm`.

1. Make sure you have `dat` and `pm2` installed globally:

```sh
npm install -g dat pm2
```

2. Clone this repository, by running:

```sh
git clone https://github.com/CezarMocan/projections.git
```

3. Make sure you are in the project directory (`cd projections`) and then install the dependencies by running:

```sh
npm install
```

4. You should now be able to start a local instance of the server on port 3000 by running:

```sh
npm run start
```

## Deploying a new version

1. In the project directory, make sure the source code is up to date and all dependencies installed:

```sh
git pull
npm install
```

2. Create a new build and deploy it to `dat` by running:

```sh
npm run deploy
```

This will build the source code and update the contens of the `dat` archive with the new static site. This command will not return, since it ends with `dat sync`. Once the contents of the archive are done processing, you can quit the `dat sync` shell (`Ctrl+C`).


## Development guide

If you wish to make changes to the source code, you can start a local development server on port 3000 by running:

```sh
npm run dev
```

This command starts the static file server, and enables the features useful for development (e.g. live reload.) If you navigate to `http://localhost:3000`, you should be able to access the sotware.

The repository uses [`React`](https://reactjs.org/) as its main javascript framework, and handles build and deployment using [`Next.js`](https://nextjs.org/).

### Repository structure

`/components`: UI individual components (e.g. a slider, a list item, etc.)

`/dat`: This is the site that gets served over `dat`. The folder contains a static build of this repository, as well as the configuration files for the `dat` archive. Every time the site is re-deployed, the contents of this folder change to the new build (but the `dat` configuration stays the same, since we're keeping the same archive and URL.)

`/modules`: Various utility files. For example:

  - `DownloadHelper.js` contains functions needed to download the `png`, `svg` and configuration files to the disk.

  - `LayerData.js` contains the configuration file for the default information layers that get displayed in the software. (raster image, Gedymin heads, etc.)

  - `ProjectionsMetadata.js` contains the creation year, author gender and country of origin for the projections we are using.

  - `RenderHelper.js` contains utility functions for projecting and displaying raster and vector images.

`/pages`: These are the components that get transformed into the website's HTML pages. We currently only have one—index. `pages/index.js` is where the bulk of the project is implemented.

`/static`: This is where the site's static assets are: images, stylesheets, geojson files, etc.

`next.config.js`: The configuration file for the `Next.js` framework.

`package.json`: The configuration file for this as a Javascript `npm` based project. Contains `npm` dependencies and scripts.
