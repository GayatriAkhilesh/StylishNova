import {useNavigation, useRoute} from '@react-navigation/native';
import {
  View,
  PermissionsAndroid,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {useDimensionContext} from '../../context';
import style from './style';
import {useEffect, useState} from 'react';
import CommonHeaderLeft from '../../components/CommonHeaderLeft';
import CommonButton from '../../components/CommonButton';
import {GooglePlacesAutocomplete} from 'react-native-google-places-autocomplete';
import MapView, {Marker, PROVIDER_GOOGLE} from 'react-native-maps';
import Snackbar from 'react-native-snackbar';
import RazorpayCheckout from 'react-native-razorpay';
import Geolocation from '@react-native-community/geolocation';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {useDispatch, useSelector} from 'react-redux';
import firestore, {doc} from '@react-native-firebase/firestore';
import {updateCartCount} from '../../storage/action';
navigator.geolocation = require('@react-native-community/geolocation');

const AddAddress = () => {
  const dimensions = useDimensionContext();
  const responsiveStyle = style(
    dimensions.windowWidth,
    dimensions.windowHeight,
    dimensions.isPortrait,
  );
  const route = useRoute();
  const {cartProducts, total} = route.params;
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const [newPosition, setNewPosition] = useState({});
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const userId = useSelector(state => state.userId);
  const firstName = useSelector(state => state.firstName);
  const lastName = useSelector(state => state.lastName);
  const email = useSelector(state => state.email);
  const mobilenumber = useSelector(state => state.mobilenumber);

  useEffect(() => {
    getCurrentLocation();
    navigation.setOptions({
      headerLeft: () => <CommonHeaderLeft type={'back'} />,
    });
  }, []);

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(info => {
      setNewPosition({
        latitude: info.coords?.latitude ?? 0,
        longitude: info.coords?.longitude ?? 0,
        latitudeDelta: 0.001,
        longitudeDelta: 0.001,
      });
    });
    Snackbar.show({
      text: 'Your Current Location Have Been Fetched. ',
      duration: Snackbar.LENGTH_LONG,
      backgroundColor: 'green',
      textColor: 'white',
    });
  };

  const handleCreateOrder = async paymentId => {
    const smallId = paymentId.slice(4, 12);
    await firestore()
      .collection('Orders')
      .add({
        orderId: String(smallId).toUpperCase(),
        created: Date.now(),
        updated: Date.now(),
        orderStatus: 'Ordered',
        totalAmount: total,
        address: address,
        userId: userId,
        paymentMethod: 'Online',
        cartItems: cartProducts,
        userName: firstName + ' ' + lastName,
        userEmail: email,
        userPhone: mobilenumber,
        expDelDate: '',
      })
      .then(async resp => {
        console.warn(resp, '----------');

        await firestore()
          .collection('Cart')
          .where('userId', '==', userId)
          .get()
          .then(querySnapshot => {
            querySnapshot.forEach(doc => {
              doc.ref
                .delete()
                .then(() => {
                  setLoading(false);
                  dispatch(updateCartCount(0));
                  Snackbar.show({
                    text: 'Order placed successfully. ',
                    duration: Snackbar.LENGTH_LONG,
                    backgroundColor: 'green',
                    textColor: 'white',
                  });
                  setTimeout(() => {
                    navigation.goBack();
                  }, 2000);
                })
                .catch(err => {
                  console.warn(err);
                });
            });
          });
      });
  };

  const onButtonPress = () => {
    var options = {
      description: 'You are paying to StylishNova',
      image: 'https://i.imgur.com/3g7nmJC.png',
      currency: 'INR',
      key: '*******************', // Your api key
      amount: parseInt(total, 10) * 100,
      name: 'StylishNova',
      prefill: {
        email: email,
        contact: mobilenumber,
        name: `${firstName} ${lastName}`,
      },
      theme: {color: '#48301f'},
    };
    RazorpayCheckout.open(options)
      .then(data => {
        setLoading(true);
        handleCreateOrder(data.razorpay_payment_id);
      })
      .catch(error => {
        Snackbar.show({
          text: 'Order Failed, Please try again! ',
          duration: Snackbar.LENGTH_LONG,
          backgroundColor: '#d20a2e',
          textColor: 'white',
        });
        navigation.goBack();
      });
  };

  return (
    <View style={responsiveStyle.container}>
      <Modal animationType="fade" transparent={true} visible={loading}>
        <View style={responsiveStyle.activityIndi}>
          <ActivityIndicator size={'large'} color="#fff" />
        </View>
      </Modal>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always">
        <GooglePlacesAutocomplete
          placeholder="Search Location"
          currentLocation={true}
          fetchDetails={true}
          currentLocationLabel="Current Location"
          query={{
            key: '*********************************',
            language: 'en',
          }}
          styles={{
            textInput: responsiveStyle.textInput,
            predefinedPlacesDescription: responsiveStyle.description,
          }}
          onPress={(data, details) => {
            const location =
              data?.geometry?.location ?? details?.geometry?.location;
            const positionData = {
              latitude: location?.lat ?? 0,
              longitude: location?.lng ?? 0,
              latitudeDelta: 0.001,
              longitudeDelta: 0.001,
            };
            setNewPosition(positionData);
            setAddress(data?.name ?? data?.description);
          }}
        />

        <MapView
          key={newPosition.latitude}
          style={responsiveStyle.mapView}
          initialRegion={
            newPosition.latitude && newPosition.longitude ? newPosition : null
          }
          region={
            newPosition.latitude && newPosition.longitude ? newPosition : null
          }
          showsUserLocation={true}
          followsUserLocation={true}
          zoomEnabled={true}
          pitchEnabled={true}
          rotateEnabled={true}
          scrollEnabled={true}
          showsMyLocationButton={true}>
          {newPosition.latitude && newPosition.longitude && address && (
            <Marker
              title={address ?? ''}
              description="This is your marker"
              coordinate={newPosition}
              draggable={true}
            />
          )}
        </MapView>
        {address && (
          <View style={{paddingHorizontal: 15, paddingTop: 15}}>
            <Text
              style={{
                fontFamily: 'Lato-Regular',
                fontSize: 18,
                color: '#000',
              }}>
              {address}
            </Text>
          </View>
        )}

        {/* <MapView
          style={{width: '100%', height: 300}}
          initialRegion={{
            latitude: 37.78825,
            longitude: -122.4324,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
          showsUserLocation={true}
          followsUserLocation={true}
          zoomEnabled={true}
          pitchEnabled={true}
          rotateEnabled={true}
          scrollEnabled={true}
          showsMyLocationButton={true}>
          <Marker
            title={address}
            description="This is your marker"
            coordinate={{
              latitude: 37.78825,
              longitude: -122.4324,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
          />
        </MapView> */}

        {/* <MapView
            key={newPosition.latitude}
            style={responsiveStyle.mapView}
            initialRegion={
              newPosition.latitude && newPosition.longitude ? newPosition : null
            }
            region={
              newPosition.latitude && newPosition.longitude ? newPosition : null
            }
            showsUserLocation={true}
            followsUserLocation={true}
            zoomEnabled={true}
            pitchEnabled={true}
            rotateEnabled={true}
            scrollEnabled={true}
            showsMyLocationButton={true}>
            {newPosition.latitude && newPosition.longitude && (
              <Marker
                title="You are here"
                description="This is your marker"
                coordinate={newPosition}
                draggable={true}
              />
            )}
          </MapView> */}

        {/* {newPosition && (
        <MapView
          style={responsiveStyle.mapView}
          initialRegion={newPosition}
          region={newPosition}
          showsUserLocation={true}
          followsUserLocation={true}
          zoomEnabled={true}
          pitchEnabled={true}
          rotateEnabled={true}
          scrollEnabled={true}
          // provider={PROVIDER_GOOGLE}
          showsMyLocationButton={true}>
          <Marker
            title={address}
            description="This is your marker"
            coordinate={newPosition}
          />
        </MapView>
        )} */}

        {address && (
          <View style={responsiveStyle.mapAddView}>
            <Text style={responsiveStyle.mapAddText}>{address}</Text>
          </View>
        )}

        <TouchableOpacity
          style={responsiveStyle.touchView}
          onPress={getCurrentLocation}>
          <View style={responsiveStyle.iconView}>
            <FontAwesome name="location-arrow" size={20} color="#fff" />
          </View>
          <Text style={responsiveStyle.touchText}>Your Current Location</Text>
        </TouchableOpacity>

        <CommonButton
          buttonText={'Confirm location & proceed'}
          onButtonPress={onButtonPress}
        />
      </ScrollView>
    </View>
  );
};

export default AddAddress;
