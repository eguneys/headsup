import { Quad, Transform, Vec2 } from 'soli2d'
import { Color, colors } from './shared' 

const Template = new Transform()

export abstract class Play {

  get mouse() { return this.ctx.mouse }
  get input() { return this.ctx.input }
  get image() { return this.ctx.image }
  get root() { return this.ctx.root }

  anim(x: number, y: number, w: number, h: number) {
    return new Anim(this.image, x, y, w, h)
  }

  data: any

  life: number
  life0: number

  constructor(readonly ctx: Context) {}

  _set_data(data: any): this { 
    this.data = data 
    return this
  }

  init(): this { 
    this.life = 0
    this.life0 = 0
    this._init()
    return this 
  }

  update(dt: number, dt0: number) {
    this.life0 = this.life
    this.life += dt
    this._update(dt, dt0)
  }

  on_interval(t: number) {
    return Math.floor(this.life0 / t) !== Math.floor(this.life / v)
  }

  abstract _init(): void;
  abstract _update(dt: number, dt0: number): void;
}

export class Anim {

  quads: Array<Quad> = []

  frame: number = 0

  get quad(): Quad {
    if (!this.quads[this.frame]) {
      this.quads[this.frame] = Quad.make(this.image,
                                         this.x + this.w * this.frame,
                                         this.y, this.w, this.h)
    }
    return this.quads[this.frame]
  }

  get template(): Transform {
    let res = Template.clone
    res.quad = this.quad
    res.size = Vec2.make(this.w, this.h)
    return res
  }

  constructor(readonly image: HTMLImageElement,
              readonly x: number, 
              readonly y: number,
              readonly w: number,
              readonly h: number) { }
}


export abstract class PlayWithTransform extends Play {

  container!: Transform

  get x() {
    return this.container.x
  }

  get y() {
    return this.container.y
  }

  set x(x: number) {
    this.container.x = x
  }

  set y(y: number) {
    this.container.y = y
  }

  set scale(s: number) {
    this.container.scale.set_in(s)
  }

  get scale() {
    return this.container.scale.x
  }

  constructor(ctx: Context, readonly parent: Transform) {
    super(ctx)
  }

  add_after_init() {
    this.container._set_parent(this.parent)
    this.on_attached()
  }

  remove() {
    this.container._remove()
    this.on_removed()
  }

  on_attached(): void {}
  on_removed(): void {}
}

export abstract class WithPlays extends PlayWithTransform {


  get clone() {
    let res = new this.constructor(this.ctx, this.parent, this.plays)._set_data(this.data).init()
    return this
  }

  get colors() { return this.plays.colors }

  constructor(ctx: Context, parent: Transform, readonly plays: AllPlays) {
    super(ctx, parent)
  }

}

export class ColorFactory {

  colors: Array<Anim>

  constructor(image: HTMLImageElement) {
    this.colors = colors.map(color =>
                             new Anim(image, 0, color * 2, 2, 2))
  }


  quad(color: Color, lum: number) {
    let res = this.colors[color]
    res.frame = lum
    return res.quad
  }
}


