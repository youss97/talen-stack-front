import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { applicationApi } from './services/applicationApi';
import { authApi } from './services/authApi';
import { companyApi } from './services/companyApi';
import { userApi } from './services/userApi';
import { roleApi } from './services/roleApi';
import { clientApi } from './services/clientApi';
import { applicationRequestApi } from './services/applicationRequestApi';
import { recruiterApi } from './services/recruiterApi';
import { cvApi } from './services/cvApi';
import { logApi } from './services/logApi';
import { clientManagerApi } from './services/clientManagerApi';
import { emailApi } from './services/emailApi';
import { contractTypeApi } from './services/contractTypeApi';
import { applicationStatusApi } from './services/applicationStatusApi';
import { publicJobOfferApi } from './services/publicJobOfferApi';
import { interviewApi } from './services/interviewApi';
import { integrationApi } from './services/integrationApi';
import { subscriptionApi } from './services/subscriptionApi';
import { statsApi } from './services/statsApi';
import { businessCardApi } from './services/businessCardApi';
import { notificationApi } from './services/notificationApi';
import { landingApi } from './services/landingApi';
import authReducer, { logout } from './slices/authSlice';
import { errorToastMiddleware } from './errorToastMiddleware';

const apiMiddlewares = [
  applicationApi.middleware,
  authApi.middleware,
  companyApi.middleware,
  userApi.middleware,
  roleApi.middleware,
  clientApi.middleware,
  applicationRequestApi.middleware,
  recruiterApi.middleware,
  cvApi.middleware,
  logApi.middleware,
  clientManagerApi.middleware,
  emailApi.middleware,
  contractTypeApi.middleware,
  applicationStatusApi.middleware,
  publicJobOfferApi.middleware,
  interviewApi.middleware,
  integrationApi.middleware,
  subscriptionApi.middleware,
  statsApi.middleware,
  businessCardApi.middleware,
  notificationApi.middleware,
  landingApi.middleware,
];

const apiResetters = [
  applicationApi.util.resetApiState,
  authApi.util.resetApiState,
  companyApi.util.resetApiState,
  userApi.util.resetApiState,
  roleApi.util.resetApiState,
  clientApi.util.resetApiState,
  applicationRequestApi.util.resetApiState,
  recruiterApi.util.resetApiState,
  cvApi.util.resetApiState,
  logApi.util.resetApiState,
  clientManagerApi.util.resetApiState,
  emailApi.util.resetApiState,
  contractTypeApi.util.resetApiState,
  applicationStatusApi.util.resetApiState,
  publicJobOfferApi.util.resetApiState,
  interviewApi.util.resetApiState,
  integrationApi.util.resetApiState,
  subscriptionApi.util.resetApiState,
  statsApi.util.resetApiState,
  businessCardApi.util.resetApiState,
  notificationApi.util.resetApiState,
  landingApi.util.resetApiState,
];

const appReducer = combineReducers({
  auth: authReducer,
  [applicationApi.reducerPath]: applicationApi.reducer,
  [authApi.reducerPath]: authApi.reducer,
  [companyApi.reducerPath]: companyApi.reducer,
  [userApi.reducerPath]: userApi.reducer,
  [roleApi.reducerPath]: roleApi.reducer,
  [clientApi.reducerPath]: clientApi.reducer,
  [applicationRequestApi.reducerPath]: applicationRequestApi.reducer,
  [recruiterApi.reducerPath]: recruiterApi.reducer,
  [cvApi.reducerPath]: cvApi.reducer,
  [logApi.reducerPath]: logApi.reducer,
  [clientManagerApi.reducerPath]: clientManagerApi.reducer,
  [emailApi.reducerPath]: emailApi.reducer,
  [contractTypeApi.reducerPath]: contractTypeApi.reducer,
  [applicationStatusApi.reducerPath]: applicationStatusApi.reducer,
  [publicJobOfferApi.reducerPath]: publicJobOfferApi.reducer,
  [interviewApi.reducerPath]: interviewApi.reducer,
  [integrationApi.reducerPath]: integrationApi.reducer,
  [subscriptionApi.reducerPath]: subscriptionApi.reducer,
  [statsApi.reducerPath]: statsApi.reducer,
  [businessCardApi.reducerPath]: businessCardApi.reducer,
  [notificationApi.reducerPath]: notificationApi.reducer,
  [landingApi.reducerPath]: landingApi.reducer,
});

const baseStore = configureStore({
  reducer: appReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(...apiMiddlewares, errorToastMiddleware),
});

export type AppDispatch = typeof baseStore.dispatch;
export type RootState = ReturnType<typeof baseStore.getState>;

const resetApp = () => {
  baseStore.dispatch(logout());
  apiResetters.forEach((reset) => baseStore.dispatch(reset()));
};

export const store = Object.assign(baseStore, { resetApp });
