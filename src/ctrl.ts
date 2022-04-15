import { StoredJsonProp, storedJsonProp } from './storage'

export type Redraw = () => void;

export type SliceFrame = {
  x: number,
  y: number,
  w: number,
  h: number
}
export type Slice = {
  name: string,
  frames?: Array<SliceFrame>
}

const slice = (name: string) => {
  return {
    name
  }
}

export default class Ctrl {

  _id = 1
  get newSliceName() {
    return 'new_slice' + (this._id++)
  }

  option_slices: StoredJsonProp<Array<Slice>> = storedJsonProp('soureditor.slices', () => [])


  image!: HTMLImageElement

  slices: Array<Slice>

  _set_data(image: HTMLImageElement) {
    this.image = image
    this.slices = this.option_slices()
    return this;
  }

  redraw: Redraw

  ground!: AllPlays

  constructor(readonly redraw: Redraw) { }

  _set_redraw(redraw: Redraw) {
    this.redraw = redraw
  }

  init() {
    return this
  }

  _save_slices() {
    this.option_slices(this.slices)
  }

  add_slice() {
    this.slices.push({
      name: this.newSliceName
    })

    this._save_slices()

  }

  select(slice: Slice) {
    this.ground.slices = slice.frames || []
  }

  save(slice: Slice) {
    slice.frames = this.ground.slices

    this._save_slices()
  }

  remove(slice: Slice) {
    this.slices.splice(this.slices.indexOf(slice), 1)

    this._save_slices()
  }


  setGround(ground: AllPlays) {

    this.ground = ground
  }

}
