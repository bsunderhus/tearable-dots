import * as React from 'react'
import {
  Actor,
  ActorOptions,
  AnyActorLogic,
  createActor,
  InputFrom,
  ActorRefFromLogic,
  fromTransition,
  AnyActor
} from "xstate";

const transitionLogic = fromTransition(
  (state: 'red' | 'blue', event: { type: 'change_color', value: 'red' | 'blue' }) => {
    return event.value
  },
  'red',
);

const context = React.createContext<ActorRefFromLogic<typeof transitionLogic> | undefined>(undefined)


export const useChangeHandler = () => {
  const actorRef = React.useContext(context);
  if (!actorRef) {
    throw new Error('deu ruim')
  }
  return (redOrBlue: "red" | "blue") => {
    actorRef.send({ type: 'change_color', value: redOrBlue })
  };
};

export const useColor = () => {
  const actorRef = React.useContext(context);
  if (!actorRef) {
    throw new Error('deu ruim')
  }
  const color = useSnapshot(actorRef, (snapshot) => snapshot.context)
  return color;
};

export const useUnsafeChangeHandler = () => {
  const actorRef = React.useContext(context);
  if (!actorRef) {
    throw new Error('deu ruim')
  }
  return (redOrBlue: "red" | "blue") => {
    // const snapshot = actorRef.getSnapshot();
    // snapshot.context = redOrBlue;
  };
};

export const Root = ({ children }: any) => {
  const value = useActor(transitionLogic)
  return (
    <context.Provider value={value}>
      {children}
    </context.Provider>
  )
};




type Options<Logic extends AnyActorLogic> =
  undefined extends InputFrom<Logic>
  ? [options?: ActorOptions<Logic>]
  : [options: ActorOptions<Logic> & { input: InputFrom<Logic> }];

export function useActor<Logic extends AnyActorLogic>(
  logic: Logic,
  ...[options]: Options<Logic>
): Actor<Logic> {
  const [actor] = React.useState(() => createActor(logic, options));

  if (logic.config !== actor.logic.config) {
    throw new Error("useActor: logic config must not change");
  }

  React.useEffect(() => {
    actor.start();
    return () => {
      actor.stop();
    };
  }, [actor]);

  return actor;
}


interface ActorExternalStore
  extends Pick<AnyActor, "getSnapshot" | "subscribe"> {}

type ActorSnapshot<Actor extends ActorExternalStore> = ReturnType<
  Actor["getSnapshot"]
>;

export function useSnapshot<
  Actor extends ActorExternalStore,
  V = ActorSnapshot<Actor>,
>(
  actor: Actor,
  selector: (snapshot: ActorSnapshot<Actor>) => V = id,
  compare: (a: V, b: V) => boolean = defaultCompare,
): V {
  const [value, setValue] = React.useState(() => {
    console.log('useState init')
    return selector(actor.getSnapshot())
  });

  React.useEffect(
    () => {
      console.log('useEffect')
      const subscription = actor.subscribe((snapshot: ActorSnapshot<Actor>) => {
        setValue(curr => {
          const nextValue = selector(snapshot);
          if (compare(curr, nextValue)) {
            return curr
          }
          return nextValue
        });
      }, console.log, console.log)
      return () => {
        console.log('cleanUp')
        subscription.unsubscribe()
      }
    },
    [actor],
  );

  return value;
}

function defaultCompare<T>(a: T, b: T) {
  return a === b
}

function id<T>(x: T): T {
  return x
}

