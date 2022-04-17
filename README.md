## SourEditor

A web based editor, to edit slices from a texture atlas, and group them into scenes.


## Contributing

There is a local dependency WebGL rendering library that needs to be linked:

- Clone: `git clone https://github.com/eguneys/soli2d`
- Install: `yarn install`
- Link: `yarn link`

Now this repository on a separate folder:

- Clone: `git clone https://github.com/eguneys/soureditor`
- Install: `yarn install`
- Link soli2d: `yarn link soli2d`
- Build and serve: `yarn dev`
- Only build: `yarn build`
- Build and zip: `yarn dist`

## Documentation

There are two tabs at top left. `Slice` and `Group`.

### Slice Tab

Click `Add slice` to add a slice and give it a name. Click `OK` to save changes. 

Page refresh will restore your slices. Click on a slice to select it.

At the right, there is the main canvas. You can pan by `holding the middle mouse button and dragging`, and zoom with `mouse wheel`. Make a slice selection by `left click and drag`.

Select a group of sequential slices by making a slice selection and clicking to the far right where the sequential slices extend to. This will make series of slices of same length up to the clicked point. Don't forget to save your changes by clicking on `OK` button near the slice name input box.


### Group Tab

After making your slices at the `Slice` tab, go to the `Group` tab. Your slices will appear at the bottom, `Add to slice` section. Create groups same way as creating slices. Click on a group to select it.

On the right there is the main canvas. You can pan and zoom as before. Add a slice by clicking a slice name at the `Add to slice` section at the bottom. You can add multiple slices, and drag them on the main canvas to make up your scene. There is a little red box at top left of each slice on the main canvas. You can click it to remove the slice.

