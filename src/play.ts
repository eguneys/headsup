import { Transform } from 'soli2d'


abstract class Play {

  get input() { return this.ctx.input }
  get image() { return this.ctx.image }
  get root() { return this.ctx.root }

  data: any

  life: number
  life0: number

  constructor(readonly ctx: Context) {}

  _set_data(data: any) { this.data = data }

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

class Anim {

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

  constructor(readonly image: HTMLImageElement,
              readonly x: number, 
              readonly y: number,
              readonly w: number,
              readonly h: number) { }
}


abstract class PlayWithTransform extends Play {

  container!: Transform

  constructor(ctx: Context, readonly parent: Transform) {
    super(ctx)
  }

  add_after_init() {
    this.container._set_parent(parent)
    this.on_attached()
  }

  remove() {
    this.container._remove()
    this.on_removed()
  }

  on_attached(): void {}
  on_removed(): void {}
}

abstract class WithPlays extends PlayWithTransform {

  constructor(ctx: Context, parent: Transform, readonly plays: AllPlays) {
  }

}

export default class AllPlays extends PlayWithTransform {

  _init() {
    this.container = Transform.clone


  }

  _update(dt: number, dt0: number) {
  }
}
