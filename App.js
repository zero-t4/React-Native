import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  AsyncStorage,
  TouchableOpacity,
  TouchableHighlight,
  Dimensions,
  Image,
  StatusBar,
} from 'react-native';
import styled from "styled-components";
import { CalendarList  } from 'react-native-calendars';
import Modal from "react-native-modal";
import Prompt from 'rn-prompt';
import {MessageBarManager, MessageBar as MessageBarAlert} from 'react-native-message-bar';

const Container = styled.View`
  flex: 1;
  backgroundColor: hsl(${({count}) => count}, 45%, 57%);
  justifyContent: center;
  alignItems: center;
`;
const lineTop = 70;
const Circle = styled.View`
  width: ${({windowWidth}) => windowWidth - lineTop};
  height: ${({windowWidth}) => windowWidth - lineTop};
  borderRadius: ${({windowWidth}) => ((windowWidth - lineTop)/2)};
  backgroundColor: #ddd;
  borderColor: rgba(255,255,255,0.4);
  borderWidth: 3px;
  justifyContent: center;
  alignItems: center;
`;
const SmallCircleWidth = 30;
const SmallCircle = Circle.extend`
  width: ${SmallCircleWidth};
  height: ${SmallCircleWidth};
  borderRadius: ${SmallCircleWidth/2};
  borderColor: ${(props) => {
  return props.borderColor ? '#2162f3' : 'rgba(255, 0, 0, 0.5)'
}};
  borderWidth: 3px;
  justifyContent: center;
  alignItems: center;
  
`;
const StyledText = styled.Text`
  color: #ce5fda;
  fontSize: 34px;
`;
const DeleteIcon = styled.Image`
  height: 15px;
  width: 15px;
`;
const CalendarButton = DeleteIcon.extend`
  height: 25px;
  width: 25px;
`;
const BottomButtons = styled.View`
  flex: 1;
  flexDirection: row;
  alignItems: flex-end;
  justifyContent: space-between;
  padding: 10px;
`;
const CloseButton = styled.View`
  backgroundColor: lightblue;
  padding: 12px;
  margin: 16px;
  justifyContent: center;
  alignItems: center;
  borderRadius: 4px;
  borderColor: rgba(0, 0, 0, 0.1);
`;
const MainButton = styled.TouchableOpacity`
  flex: 9;
  alignItems: center;
  justifyContent: center;
`;

const KEY_NAME = "@MySuperStore:async_key";

export default class App extends Component<{}> {
  state = {
    count: 0,
    windowWidth: 300,
    modalVisible: false
  };

  onButton = async () => {
    let current = await App.getKey();
    current++;

    await App.saveKey(current);
    this.syncState();
  };

  onRemove = async () => {
    this.setState({
      promptVisible: true
    });
  };

  onCalendarButton = () => {
    this.setState({modalVisible: true});
  };

  closeModal = () => {
    this.setState({
      modalVisible: false
    });
  };

  syncState = async () => {
    this.setState({
      count: await App.getKey()
    });
  };

  async componentWillMount() {
    Dimensions.addEventListener("change", ({window}) => {
      this.setState({
        windowWidth: Math.min(window.width, window.height)
      });
    });

    this.setState({
      windowWidth: Math.min(
        Dimensions.get("window").width,
        Dimensions.get("window").height
      )
    });
    if (!await App.getKey()) {
        //set initial state at the first launch
        await this.initStorage();
    } else {
        this.syncState();
    }
  }

  componentDidMount() {
    MessageBarManager.registerMessageBar(this.refs.alert);
  }

  componentWillUnmount() {
    MessageBarManager.unregisterMessageBar();
  }

  alert = () => {
    debugger
    MessageBarManager.showAlert({
      title: 'Alert message',
      message: this.state.message,
      alertType: 'success',
    });

    setTimeout(()=> {
      MessageBarManager.hideAlert();
    }, 3000);
  };

  static async getKey() {
    return JSON.parse(await AsyncStorage.getItem(KEY_NAME));
  }

  static async saveKey(value) {
    return await AsyncStorage.setItem(KEY_NAME, JSON.stringify(value));
  }

  static async initStorage() {
    const initStore = [];
    return await AsyncStorage.setItem(KEY_NAME, JSON.stringify(initStore));
  }


  promptOnCancel = async () => {
    await this.setState({
      promptVisible: false,
      message: "You cancelled"
    });
    this.alert();
  };

  promptOnSubmit =  async (value) => {
    if (value.toLowerCase() === 'yes') {
      await this.setState({
        promptVisible: false,
        message: `You said "${value}"`
      });

      await App.saveKey(1);
      this.syncState();
      this.alert();
    } else {
      this.promptOnCancel();
    }
  };

  render() {
    const {count} = this.state;
    return (
      <Container count={count}>
        <StatusBar
          backgroundColor={`hsl(${this.state.count}, 55%, 57%)`}
          barStyle="light-content"
        />

        <MainButton onPress={this.onButton}>
          <Circle windowWidth={this.state.windowWidth}>
            <StyledText>
              <Text style={{fontSize: 64}}>{count}</Text>
              / 365
            </StyledText>
          </Circle>
        </MainButton>

        <BottomButtons>
          <TouchableOpacity onPress={this.onCalendarButton}>
            <SmallCircle borderColor windowWidth={this.state.windowWidth}>
              <CalendarButton source={require("./img/calendar.png")}/>
            </SmallCircle>
          </TouchableOpacity>
          <TouchableOpacity
            style={{flex: 1, alignItems: 'flex-end'}}
            onPress={this.onRemove}>
            <SmallCircle windowWidth={this.state.windowWidth}>
              <DeleteIcon source={require("./img/delete.png")}/>
            </SmallCircle>
          </TouchableOpacity>
        </BottomButtons>

        <Modal
          isVisible={this.state.modalVisible}
          onBackdropPress={this.closeModal}
        >
          <View style={{height: 400}}>
            <CalendarList
              markedDates={{
                "2018-01-16": {marked: true},
                "2018-01-17": {marked: true},
                "2018-01-18": {marked: true, dotColor: "red"},
                "2018-01-19": {disabled: true}
              }}
            />
            <TouchableOpacity onPress={this.closeModal}>
              <CloseButton>
                <Text>Close</Text>
              </CloseButton>
            </TouchableOpacity>
          </View>
        </Modal>

        <Prompt
          title="Are you sure you want to delete all check?(type 'yes' to confirm)"
          placeholder="Start typing"
          visible={this.state.promptVisible}
          onCancel={this.promptOnCancel}
          onSubmit={this.promptOnSubmit}
        />

        <MessageBarAlert ref="alert" />
      </Container>
    );
  }
}