# react-native-screens: on Android, Back does not close the header's search bar

On Android, with `headerSearchBarOptions` and text typed in the search bar,
Back closes the keyboard and then does nothing visible. The press after that
leaves the screen if React Navigation can go back from it, with the search bar
never closed. On the first screen it clears the text and opens the keyboard
again instead, and only the sixth press closes the search bar.
`disableBackButtonOverride` defaults to `false`, which its documentation
describes as "Specifies whether the back button should close search bar's
text input or not".

Three things cause this, two of them in `CustomSearchView`:

1. Its back callback sets `isIconified = true`. AppCompat's
   `SearchView.setIconified(true)` is the close button's `onCloseClicked()`,
   which closes the field only when it is empty: with text, it clears the
   text, focuses the field and shows the keyboard. `cancelSearch()` clears the
   text before calling `setIconified(true)`, which is why it closes in one
   call.
2. The callback is registered on the activity's `OnBackPressedDispatcher`
   (`FragmentBackPressOverrider.maybeAddBackCallback`). With predictive back
   off, as here and in Expo's template (`predictiveBackGestureEnabled:
   false`), Back reaches `Activity.onKeyUp`, which calls
   `ReactActivity.onBackPressed()`. React Native gives Back to JavaScript
   first, and the dispatcher is reached only through
   `invokeDefaultOnBackPressed()`, when no JavaScript handler takes it. So on
   any screen React Navigation can go back from, the callback never runs, and
   Back pops the screen with its search bar open.
3. While the field has focus, AppCompat's
   `SearchView.SearchAutoComplete.onKeyPreIme` takes Back to clear the field's
   focus and hide the keyboard together. On Android 17, Back with the keyboard
   shown closes the keyboard without reaching `onKeyPreIme` (Android's own
   reference for `View.onKeyPreIme` says "Due to a bug, this function is not
   called for BACK key events on Android T and U, when the IME is shown"). So
   the field keeps its focus, and the next Back is spent on `clearFocus()`,
   which changes nothing on screen but the cursor.

## Steps

1. Start an Android emulator, then run `npm install` and
   `npx expo run:android`. Android 17 asks whether the app may find nearby
   devices, which the development build needs to load from Metro: allow it.
2. Press *Open Results*.
3. Press the header's search icon and type `zeus` with the on-screen keyboard.
4. Press Back: the keyboard closes.
5. Press Back: nothing changes but the cursor leaving the field.
6. Press Back: the app goes back to Home. The search bar on Results was never
   closed.
7. On Home, press the header's search icon and type `zeus`.
8. Press Back: the keyboard closes.
9. Press Back: nothing changes but the cursor leaving the field.
10. Press Back: the text is cleared and the keyboard opens again, and the
    search bar stays open.
11. Press Back three more times: the keyboard closes, then nothing visible
    happens, then the search bar closes.

Expected: once the keyboard has closed, one Back closes the search bar on
either screen, and the next one goes back.

## Observed

Debug build as the steps say, expo 58.0.26, React Native 0.88.1,
react-native-screens 4.30.1, @react-navigation/native-stack 7.21.1, Android 17
emulator (Pixel 9a, x86_64), 2026-11-26: as the steps say. With a debugger
attached to the same build, steps 5 and 9 stopped in
`SearchAutoComplete.onKeyPreIme`, then `SearchView.clearFocus()`. Step 6
stopped in `ReactActivity.onBackPressed()` alone, reaching neither
`OnBackPressedDispatcher.onBackPressed()` nor the search bar's callback. Step
10 stopped in `ReactActivity.onBackPressed()`, then
`OnBackPressedDispatcher.onBackPressed()` and the search bar's callback.
Steps 4 and 8 stopped in none of them. Predictive back on was not tried.
