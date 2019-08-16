# proj.ections.net

## Initial setup

0. Make sure `node` and `npm` are installed and up to date. Running `node -v` should return something newer than `v10.0.0`. Running `npm -v` should return something newer than `6.0.0`. If that is not the case, follow the instructions [here](https://nodejs.org/en/download/package-manager/) to install `node` and `npm`.

1. Make sure you have `dat` installed globally:

```sh
npm install -g dat
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

### Repository structure


