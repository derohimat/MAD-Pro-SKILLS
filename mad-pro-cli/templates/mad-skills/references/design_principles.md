# Jetpack Compose Design Principles

Compose isn't just a new UI toolkit; it's a shift in how we think about building UIs.

## 1. Declarative over Imperative

- **Imperative**: You manually mutate the UI state (e.g., `textView.text = "Hello"`). You manage the transition between states.
- **Declarative**: You describe what the UI should look like for a given state. Compose handles the transitions (recomposition) automatically.

## 2. Composition over Inheritance

Compose favors shallow hierarchies of reusable components rather than deep class inheritance.

- **Slot API**: Instead of extending a class, pass a `@Composable` lambda to a "slot" to customize content.
- **Small Components**: Build complex UIs by combining many small, single-purpose composables.

## 3. Unidirectional Data Flow (UDF)

- **State flows down**: The parent provides data to the child via parameters.
- **Events flow up**: The child notifies the parent of user interactions via lambdas.

This makes the UI predictable, easier to test, and reduces bugs related to state synchronization.

## 4. Pure & Stateless Composables

A good composable should ideally be a "pure function" of its arguments.

- **Stateless**: The composable doesn't manage its own state; it receives it (State Hoisting).
- **Side-Effect Free**: Recomposition can happen many times. Never perform business logic, network calls, or database writes directly inside a composable function. Use `LaunchedEffect` or `produceState`.

## 5. Single Source of Truth

State should live in one place (usually a `ViewModel`). Any piece of data should have exactly one "owner" who is responsible for updating it.

## 6. Stability and Idempotence

- **Stable**: If the inputs haven't changed, the output (UI) shouldn't change.
- **Idempotent**: Running the same composable with the same parameters should always produce the same result and have no side effects.

## Why it Matters

Following these principles leads to:

1. **Less Code**: Declarative UI is often much more concise than XML.
2. **Fewer Bugs**: UDF eliminates entire classes of state-synchronization bugs.
3. **Easier Testing**: Pure functions are straightforward to unit test.
4. **Better Performance**: Compose can skip recomposition for stable, unchanged components.
