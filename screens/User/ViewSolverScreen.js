import React from 'react';
import { connect } from 'react-redux';
import { StyleSheet, View, Image, Text, TextInput, Button, CameraRoll, Alert, TouchableHighlight} from 'react-native';
import { ImagePicker } from 'expo';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { RNS3 } from 'react-native-aws3';
import * as Actions from '../../actions';
import db from '../../db';
import config from '../../config/config';
import EditPhototagModal from '../../components/editPhototagModal';

const awsOptions = {
  keyPrefix: 'phototags/',
  bucket: 'arcity',
  region: 'us-east-1',
  accessKey: config.aws.accessKey,
  secretKey: config.aws.secretKey,
  successActionStatus: 201,
};

const mapStateToProps = (state, ownProps) => {
  return {
    user: state.user,
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    updatePhototag: phototag => {
      dispatch(Actions.updatePhototag(phototag));
    },
    updateUser: userData => {
      dispatch(Actions.updateUser(userData));
    },
  };
};

const generateRandomID = () => {
  return 'xxxxx-xx4xxxy-xxxxxx'.replace(/[xy]/g, function(c) {
    var r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

class ViewSolverScreen extends React.Component {
  static navigationOptions = {
    title: 'Volunteer a Fix',
  };

  state = {
    solution: this.props.navigation.state.params,
    description: this.props.navigation.state.params.description,
    photoUri: this.props.navigation.state.params.imageUrl,
    modalEditVis: false,
    modalSolutionsVis: false,
    modalNavRightButton: {
      title: 'Save',
      handler: () => {
        this.saveDescription(this.state.editedDescription);
        this.toggleEditModal();
      },
    },
    modalNavLeftButton: {
      title: 'Cancel',
      handler: () => {
        this.toggleEditModal();
      },
    },
    editedDescription: this.props.navigation.state.params.description,
  }

  _takePic = async () => {
    console.log('click image');
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [16, 9],
      base64: true,
      exif: true,
    });

    if (!result.cancelled) {
      CameraRoll.saveToCameraRoll(result.uri);
      this.setState({ photoUri: result.uri });
    }
  };

  handleSaveSolution = () => {
    let isNewPhoto = this.state.photoUri !== this.state.solution.imageUrl;

    if (isNewPhoto) {
      // Set up file uri to save to AWS
      let photoIdName = generateRandomID();
      let file = {
        uri: this.state.photoUri,
        name: `${photoIdName}.jpg`,
        type: 'image/jpg',
      };

      // Make AWS upload request
      RNS3.put(file, awsOptions).then(response => {
        if (response.status !== 201) {
          console.log('[s3 upload] ERROR failed to upload image', response.body);
          // TODO: handle error through alert
        } else {
          console.log('[s3 upload] Success!');
          let awsUrl = `https://s3.amazonaws.com/${awsOptions.bucket}/${awsOptions.keyPrefix}${photoIdName}.jpg`;
          let newSolution = {
            imageUrl: awsUrl,
            description: this.state.text,
          };
          this.updateSolution(this.props.user.id, newSolution);
        }
      });
    } else {
      let newSolution = {
        imageUrl: this.state.photoUri,
        description: this.state.text,
      };
      this.updateSolution(this.props.user.id, newSolution);
      Alert.alert('Success', 'Solution posted', [
        {
          text: 'OK',
          onPress: () => {
            this.props.navigation.goBack();
          },
        },
      ]);
    }
  };

  updateSolution = (userId, solutionData) => {
    // update the solutions node in firebase
    // let newSolutionId = db.child('solutions').push().key;
    var newSolutionId = this.state.solution.id;
    db
      .child('solutions/' + newSolutionId)
      .update(solutionData)
      .then(() => {
        console.log('Solution updated. Id is', newSolutionId);
        // do something
      })
      .catch(error => console.log('Error writing to solutions', error));

    // // update the users node
    // let userData = Object.assign({}, this.props.user);
    // userData.solutions[newSolutionId] = true;
    // this.props.updateUser(userData);

    // // update the phototags node
    // let photoData = Object.assign({}, this.state.phototag);
    // photoData.solutions[newSolutionId] = true;
    // this.props.updatePhototag(photoData);
   };
   openEditDescription = () => {
    console.log('Editing description');
    this.toggleEditModal();
  };

  editDescription = description => {
    this.setState({ editedDescription: description });
  };

  toggleEditModal = () => {
    this.setState({ modalEditVis: !this.state.modalEditVis });
  };


  render() {
    let isEditable = this.props.user.id === this.state.solution.userId;
    return (
      <KeyboardAwareScrollView contentContainerStyle={styles.scrollViewContainer}>
        <Image
          onPress={this.handleSelectImage}
          style={{ width: 300, height: 300, resizeMode: Image.resizeMode.contain }}
          source={{ uri: this.state.photoUri }}
        />
        <Text>{this.state.description}</Text>
         <EditPhototagModal
          toggleEditModal={this.modalEditVis}
          modalEditVis={this.state.modalEditVis}
          modalNavRightButton={this.state.modalNavRightButton}
          modalNavLeftButton={this.state.modalNavLeftButton}
          editedDescription={this.state.editedDescription}
          editDescription={this.editDescription}
        />
         {isEditable && (
            <TouchableHighlight onPress={this.openEditDescription}>
              <Ionicons name="md-create" size={28} color="gray" style={styles.iconStyle} />
            </TouchableHighlight>
          )}
        <View>
          <Text>(Optional) Take an updated image of the site</Text>
          <Button title="Take new photo" onPress={this._takePic} />
        </View>
        <Button title="Submit" onPress={this.handleSaveSolution} />
      </KeyboardAwareScrollView>
    );
  }
}

const styles = {
  scrollViewContainer: {
    alignItems: 'center',
    paddingBottom: 50,
  },
  titleText: {
    textAlign: 'center',
    fontSize: 20,
    alignItems: 'center',
  },
  imageSetting: {
    width: 200,
    height: 200,
  },
  descriptionInput: {
    height: 80,
    borderColor: 'gray',
    borderWidth: 1,
    width: '80%',
    textAlignVertical: 'top',
    fontSize: 16,
    padding: 10,
  },
  center: {
    alignItems: 'center',
  },
};

export default connect(mapStateToProps, mapDispatchToProps)(ViewSolverScreen);

// <TextInput
//           style={styles.descriptionInput}
//           placeholder={this.state.text}
//           onChangeText={text => this.setState({ text: text })}
//           keyboardType={'default'}
//           multiline
//           ref={input => {
//             this.descriptionInput = input;
//           }}
//         />
