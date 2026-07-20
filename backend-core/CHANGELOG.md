# @tindanzor/auth-server

## 2.3.2

### Patch Changes

- 887280a: Added forgetten the unique id to protected signup ids, used for invalidating signup. Fixed request pasword resetd bug (user password not added to secret signing)

## 2.3.1

### Patch Changes

- d05c29c: Fixed: Protected access token signing

## 2.3.0

### Minor Changes

- 15c1ef1: Updated cookie config creation to be interally handled

## 2.2.1

### Patch Changes

- 75aedad: Fixed: unable to extend user roles

## 2.2.0

### Minor Changes

- 42ea09f: Added user data to signin and signup response data

## 2.1.1

### Patch Changes

- ddf5870: Fixed role undefinded errors

## 2.1.0

### Minor Changes

- 5d09f52: Added roles builder for checker

## 2.0.1

### Patch Changes

- 8bb424f: update the package documentation

## 2.0.0

### Major Changes

- 70a3b97: Added a createAuthenctionService function that composes and returns a simple easy to use authService and userService
