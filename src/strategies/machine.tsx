import * as React from 'react'
import {fromTransition} from 'xstate'
import {createActorContext} from '@xstate/react'

const transitionLogic = fromTransition(
    (state: 'red' | 'blue', event: {type: 'change_color', value: 'red' | 'blue'}) => event.value,
    'red',
);


const {Provider,useActorRef,useSelector} = createActorContext(transitionLogic)



export const useChangeHandler = () => {
  const actorRef = useActorRef();
  return (redOrBlue: "red" | "blue") => {
    actorRef.send({type: 'change_color', value: redOrBlue})
  };
};

export const useColor = () => {
  const color = useSelector(snapshot => snapshot.context)
  return color;
};

export const useUnsafeChangeHandler = () => {
  const actorRef = useActorRef();
  return (redOrBlue: "red" | "blue") => {
    const snapshot = actorRef.getSnapshot();
    snapshot.context = redOrBlue;
  };
};

export const Root = ({ children }: any) => (
    <Provider>
      {children}
    </Provider>
  );