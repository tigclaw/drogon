import { Notifications } from 'expo';
import React from 'react';
import { StackNavigator } from 'react-navigation';
import MainTabNavigator from './MainTabNavigator';
import LoginScreen from '../screens/LoginScreen';
import selectedPhototagMap from '../screens/selectedPhototagMap';
import selectedPhototagUser from '../screens/SelectedPhotoTagUser';
import registerForPushNotificationsAsync from '../api/registerForPushNotificationsAsync';

// RootNavigation actually uses a StackNavigator but the StackNavigator in turn loads a TabNavigator
const RootStackNavigator = StackNavigator(
  {
    Login: {
      screen: LoginScreen,
    },
    Main: {
      screen: MainTabNavigator,
    },
    phototagFromMap: {
      screen: selectedPhototagMap,
    },
    phototagFromUser: {
      screen: selectedPhototagUser,
    },
  },
  {
    navigationOptions: () => ({
      headerTitleStyle: {
        fontWeight: 'normal',
      },
    }),
  }
);

export default class RootNavigator extends React.Component {
  static navigationOptions = {
    title: 'Login',
  };

  componentWillUnmount() {
    this._notificationSubscription && this._notificationSubscription.remove();
  }

  render() {
    return <RootStackNavigator />;
  }

  _registerForPushNotifications() {
    // Send our push token over to our backend so we can receive notifications
    // You can comment the following line out if you want to stop receiving
    // a notification every time you open the app. Check out the source
    // for this function in api/registerForPushNotificationsAsync.js
    registerForPushNotificationsAsync();

    // Watch for incoming notifications
    this._notificationSubscription = Notifications.addListener(this._handleNotification);
  }

  _handleNotification = ({ origin, data }) => {
    console.log(`Push notification ${origin} with data: ${JSON.stringify(data)}`);
  };
}
