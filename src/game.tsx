import { useApp } from './app'
import { Quad, Vec2 } from 'soli2d-js/web'

const Game = () => {


  return (<>
          <Anim qs={[0, 96, 30, 40]}/>
          </>)
}

export default Game

export const Anim = (props) => {

  const [{image, root}] = useApp()

  return (<transform
          quad={Quad.make(image(), ...props.qs)}
          size={Vec2.make(props.qs[2], props.qs[3])}
          x={props.x}
          y={props.y}
          />)
}
