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

export const useColor = (startTransition?: typeof React.startTransition) => {
  const actorRef = React.useContext(context);
  if (!actorRef) {
    throw new Error('deu ruim')
  }
  const color = useSnapshot(actorRef, (snapshot) => snapshot.context, {startTransition})
  return color;
};

export const useUnsafeChangeHandler = () => {
  const actorRef = React.useContext(context)
  return (redOrBlue: "red" | "blue") => {
    (actorRef as any)._snapshot.context = redOrBlue
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


interface ExternalStore
  extends Pick<AnyActor, "getSnapshot" | "subscribe"> {}

type SnapshotValue<Actor extends ExternalStore> = ReturnType<
  Actor["getSnapshot"]
>;

interface UseSnapshotOptions<V> {
  isEqual?(a: V, b: V): boolean
  startTransition?(scope: React.TransitionFunction): void
}

export function useSnapshot<
  Actor extends ExternalStore,
  Selection = SnapshotValue<Actor>,
>(
  actor: Actor,
  selector: (snapshot: SnapshotValue<Actor>) => Selection = id,
  options: UseSnapshotOptions<Selection> = {}
): Selection {
  const {isEqual = Object.is, startTransition = defaultStartTransition} = options
  const [value, setValue] = React.useState(() => {
    return selector(actor.getSnapshot())
  });

  React.useEffect(
    () => {
      const {unsubscribe} = actor.subscribe((snapshot: SnapshotValue<Actor>) => {
        const nextValue = selector(snapshot);
        startTransition(() => {
          setValue(currentValue => isEqual(currentValue, nextValue) ? currentValue : nextValue);
        })
      })
      return unsubscribe
    },
    [actor],
  );


  return value;
}

function id<T>(x: T): T {
  return x
}


function defaultStartTransition(cb: React.TransitionFunction) {
  cb()
}