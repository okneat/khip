import configureStore from 'redux-mock-store';
import promiseMiddleware from 'redux-promise-middleware';
import axios from 'axios';
import thunk from 'redux-thunk';
import sinon from 'sinon';

import {FAILURE, REQUEST, SUCCESS} from 'app/shared/reducers/action-type.util';
import userManagement, {
  ACTION_TYPES,
  createUser,
  deleteUser,
  getRoles,
  getUser,
  getUsers,
  reset,
  updateUser,
} from 'app/modules/administration/user-management/user-management.reducer';
import {defaultValue} from 'app/shared/model/user.model';
import {AUTHORITIES} from 'app/config/constants';

describe('User management reducer tests', () => {
  const username = process.env.E2E_USERNAME || 'admin';

  function isEmpty(element): boolean {
    if (element instanceof Array) {
      return element.length === 0;
    } else {
      return Object.keys(element).length === 0;
    }
  }

  function testInitialState(state) {
    expect(state).toMatchObject({
      loading: false,
      errorMessage: null,
      updating: false,
      updateSuccess: false,
      totalItems: 0,
    });
    expect(isEmpty(state.users));
    expect(isEmpty(state.authorities));
    expect(isEmpty(state.user));
  }

  function testMultipleTypes(types, payload, testFunction) {
    types.forEach(e => {
      testFunction(userManagement(undefined, {type: e, payload}));
    });
  }

  describe('Common', () => {
    it('should return the initial state', () => {
      testInitialState(userManagement(undefined, {}));
    });
  });

  describe('Requests', () => {
    it('should not modify the current state', () => {
      testInitialState(userManagement(undefined, {type: REQUEST(ACTION_TYPES.FETCH_ROLES)}));
    });

    it('should set state to loading', () => {
      testMultipleTypes([REQUEST(ACTION_TYPES.FETCH_USERS), REQUEST(ACTION_TYPES.FETCH_USER)], {}, state => {
        expect(state).toMatchObject({
          errorMessage: null,
          updateSuccess: false,
          loading: true,
        });
      });
    });

    it('should set state to updating', () => {
      testMultipleTypes(
        [REQUEST(ACTION_TYPES.CREATE_USER), REQUEST(ACTION_TYPES.UPDATE_USER), REQUEST(ACTION_TYPES.DELETE_USER)],
        {},
        state => {
          expect(state).toMatchObject({
            errorMessage: null,
            updateSuccess: false,
            updating: true,
          });
        }
      );
    });
  });

  describe('Failures', () => {
    it('should set state to failed and put an error message in errorMessage', () => {
      testMultipleTypes(
        [
          FAILURE(ACTION_TYPES.FETCH_USERS),
          FAILURE(ACTION_TYPES.FETCH_USER),
          FAILURE(ACTION_TYPES.FETCH_ROLES),
          FAILURE(ACTION_TYPES.CREATE_USER),
          FAILURE(ACTION_TYPES.UPDATE_USER),
          FAILURE(ACTION_TYPES.DELETE_USER),
        ],
        'something happened',
        state => {
          expect(state).toMatchObject({
            loading: false,
            updating: false,
            updateSuccess: false,
            errorMessage: 'something happened',
          });
        }
      );
    });
  });

  describe('Success', () => {
    it('should update state according to a successful fetch users request', () => {
      const headers = {['x-total-count']: 42};
      const payload = {data: 'some handsome users', headers};
      const toTest = userManagement(undefined, {type: SUCCESS(ACTION_TYPES.FETCH_USERS), payload});

      expect(toTest).toMatchObject({
        loading: false,
        users: payload.data,
        totalItems: headers['x-total-count'],
      });
    });

    it('should update state according to a successful fetch user request', () => {
      const payload = {data: 'some handsome user'};
      const toTest = userManagement(undefined, {type: SUCCESS(ACTION_TYPES.FETCH_USER), payload});

      expect(toTest).toMatchObject({
        loading: false,
        user: payload.data,
      });
    });

    it('should update state according to a successful fetch role request', () => {
      const payload = {data: [AUTHORITIES.ADMIN]};
      const toTest = userManagement(undefined, {type: SUCCESS(ACTION_TYPES.FETCH_ROLES), payload});

      expect(toTest).toMatchObject({
        loading: false,
        authorities: payload.data,
      });
    });

    it('should set state to successful update', () => {
      testMultipleTypes([SUCCESS(ACTION_TYPES.CREATE_USER), SUCCESS(ACTION_TYPES.UPDATE_USER)], {data: 'some handsome user'}, types => {
        expect(types).toMatchObject({
          updating: false,
          updateSuccess: true,
          user: 'some handsome user',
        });
      });
    });

    it('should set state to successful update with an empty user', () => {
      const toTest = userManagement(undefined, {type: SUCCESS(ACTION_TYPES.DELETE_USER)});

      expect(toTest).toMatchObject({
        updating: false,
        updateSuccess: true,
      });
      expect(isEmpty(toTest.user));
    });
  });

  describe('Reset', () => {
    it('should reset the state', () => {
      const initialState = {
        loading: false,
        errorMessage: null,
        users: [],
        authorities: [] as any[],
        user: defaultValue,
        updating: false,
        updateSuccess: false,
        totalItems: 0,
      };
      const payload = {
        ...initialState,
        loading: true,
      };
      expect(
        userManagement(payload, {
          type: ACTION_TYPES.RESET,
        })
      ).toEqual(initialState);
    });
  });

  describe('Actions', () => {
    let store;

    const resolvedObject = {value: 'whatever'};
    beforeEach(() => {
      const mockStore = configureStore([thunk, promiseMiddleware]);
      store = mockStore({});
      axios.get = sinon.stub().returns(Promise.resolve(resolvedObject));
      axios.put = sinon.stub().returns(Promise.resolve(resolvedObject));
      axios.post = sinon.stub().returns(Promise.resolve(resolvedObject));
      axios.delete = sinon.stub().returns(Promise.resolve(resolvedObject));
    });

    it('dispatches FETCH_USERS_PENDING and FETCH_USERS_FULFILLED actions', async () => {
      const expectedActions = [
        {
          type: REQUEST(ACTION_TYPES.FETCH_USERS),
        },
        {
          type: SUCCESS(ACTION_TYPES.FETCH_USERS),
          payload: resolvedObject,
        },
      ];
      await store.dispatch(getUsers()).then(() => expect(store.getActions()).toEqual(expectedActions));
    });
    it('dispatches FETCH_USERS_PENDING and FETCH_USERS_FULFILLED actions with pagination options', async () => {
      const expectedActions = [
        {
          type: REQUEST(ACTION_TYPES.FETCH_USERS),
        },
        {
          type: SUCCESS(ACTION_TYPES.FETCH_USERS),
          payload: resolvedObject,
        },
      ];
      await store.dispatch(getUsers(1, 20, 'id,desc')).then(() => expect(store.getActions()).toEqual(expectedActions));
    });
    it('dispatches FETCH_ROLES_PENDING and FETCH_ROLES_FULFILLED actions', async () => {
      const expectedActions = [
        {
          type: REQUEST(ACTION_TYPES.FETCH_ROLES),
        },
        {
          type: SUCCESS(ACTION_TYPES.FETCH_ROLES),
          payload: resolvedObject,
        },
      ];
      await store.dispatch(getRoles()).then(() => expect(store.getActions()).toEqual(expectedActions));
    });
    it('dispatches FETCH_USER_PENDING and FETCH_USER_FULFILLED actions', async () => {
      const expectedActions = [
        {
          type: REQUEST(ACTION_TYPES.FETCH_USER),
        },
        {
          type: SUCCESS(ACTION_TYPES.FETCH_USER),
          payload: resolvedObject,
        },
      ];
      await store.dispatch(getUser(username)).then(() => expect(store.getActions()).toEqual(expectedActions));
    });
    it('dispatches CREATE_USER_PENDING and CREATE_USER_FULFILLED actions', async () => {
      const expectedActions = [
        {
          type: REQUEST(ACTION_TYPES.CREATE_USER),
        },
        {
          type: SUCCESS(ACTION_TYPES.CREATE_USER),
          payload: resolvedObject,
        },
        {
          type: REQUEST(ACTION_TYPES.FETCH_USERS),
        },
        {
          type: SUCCESS(ACTION_TYPES.FETCH_USERS),
          payload: resolvedObject,
        },
      ];
      await store.dispatch(createUser()).then(() => expect(store.getActions()).toEqual(expectedActions));
    });
    it('dispatches UPDATE_USER_PENDING and UPDATE_USER_FULFILLED actions', async () => {
      const expectedActions = [
        {
          type: REQUEST(ACTION_TYPES.UPDATE_USER),
        },
        {
          type: SUCCESS(ACTION_TYPES.UPDATE_USER),
          payload: resolvedObject,
        },
        {
          type: REQUEST(ACTION_TYPES.FETCH_USERS),
        },
        {
          type: SUCCESS(ACTION_TYPES.FETCH_USERS),
          payload: resolvedObject,
        },
      ];
      await store.dispatch(updateUser({login: username})).then(() => expect(store.getActions()).toEqual(expectedActions));
    });
    it('dispatches DELETE_USER_PENDING and DELETE_USER_FULFILLED actions', async () => {
      const expectedActions = [
        {
          type: REQUEST(ACTION_TYPES.DELETE_USER),
        },
        {
          type: SUCCESS(ACTION_TYPES.DELETE_USER),
          payload: resolvedObject,
        },
        {
          type: REQUEST(ACTION_TYPES.FETCH_USERS),
        },
        {
          type: SUCCESS(ACTION_TYPES.FETCH_USERS),
          payload: resolvedObject,
        },
      ];
      await store.dispatch(deleteUser(username)).then(() => expect(store.getActions()).toEqual(expectedActions));
    });
    it('dispatches ACTION_TYPES.RESET actions', async () => {
      const expectedActions = [
        {
          type: ACTION_TYPES.RESET,
        },
      ];
      await store.dispatch(reset());
      expect(store.getActions()).toEqual(expectedActions);
    });
  });
});
