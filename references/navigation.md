# Navigation in Jetpack Compose

Modern Compose navigation is type-safe and integrated with the ViewModel lifecycle.

## Type-Safe Navigation (Compose 2.8.0+)

1. **Define Routes as Classes/Objects**: Annotated with `@Serializable`.
2. **Setup NavHost**: Use the class/object instances directly.

### Example Configuration

```kotlin
@Serializable
object Home

@Serializable
data class Profile(val userId: String)

@Composable
fun AppNavigation(navController: NavHostController) {
    NavHost(navController = navController, startDestination = Home) {
        composable<Home> {
            HomeScreen(onNavigateToProfile = { id ->
                navController.navigate(Profile(id))
            })
        }
        composable<Profile> { backStackEntry ->
            val profile: Profile = backStackEntry.toRoute()
            ProfileScreen(userId = profile.userId)
        }
    }
}
```

## 2. Best Practices

- **Screen Composable**: The direct child of a `composable<Route>` should be a "Screen" level composable that takes the ViewModel.
- **Navigating from VM**: Use a `NavigationManager` or a `SideEffect` (Channel/SharedFlow) to trigger navigation from the ViewModel, rather than passing the `NavController` into the ViewModel.
- **Single Top Bar**: Usually, a single top bar in the parent `Scaffold` is easier to manage, using `navController.currentBackStackEntryAsState()` to update the title.

## 3. Deep Linking

- Routes defined as classes handle deep links naturally with the same parameters.
- Define `deepLinks` within the `composable` builder if specific URI patterns are needed.

## 4. Pro Tip

Avoid hardcoded strings for routes. Always use the new Kotlin Serialization-based navigation for compile-time safety.
