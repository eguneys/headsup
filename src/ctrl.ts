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

export type Group = {
  name: string
}

export type Tab = 1 | 2

export default class Ctrl {

  _id = 1
  get newSliceName() {
    return 'new_slice' + (this._id++)
  }

  get newGroupName() {
    return 'new_group' + (this._id++)
  }

  option_slices: StoredJsonProp<Array<Slice>> = storedJsonProp('soureditor.slices', () => [])
  option_groups: StoredJsonProp<Array<Group>> = storedJsonProp('soureditor.groups', () => [])
  option_tab: StoredJsonProp<Tab> = storedJsonProp('soureditor.tab', () => 1)

  get current_tab() {
    return this.option_tab()
  }

  set current_tab(v: Tab) {
    this.option_tab(v)
  }


  image!: HTMLImageElement

  slices: Array<Slice>
  groups: Array<Group>

  _set_data(image: HTMLImageElement) {
    this.image = image
    this.slices = this.option_slices()
    this.groups = this.option_groups()
    return this;
  }

  redraw: Redraw

  _ground!: [AllPlays, Handler]

  get ground() {
    return this._ground[0]
  }

  get ground_dispose() {
    return this._ground[1]
  }



  constructor(readonly redraw: Redraw) { }

  _set_redraw(redraw: Redraw) {
    this.redraw = redraw
  }

  init() {
    return this
  }

  add_group() {
    this.groups.push({
      name: this.newGroupName
    })
    this._save_groups()
  }

  _save_groups() {
    this.option_groups(this.groups)
  }

  select_group(group: Group) {

  }

  save_group(group: Group) {
    this._save_groups()
  }


  remove_group(group: Group) {
    this.groups.splice(this.groups.indexOf(group), 1)
    this._save_groups()
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


  setGround(ground: [AllPlays, Handler]) {
    if (this._ground) {
      this.ground_dispose()
    }
    this._ground = ground
  }

}
