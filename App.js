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
import _ from 'lodash';

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
    data: [],
    count: 0,
    windowWidth: 300,
    modalVisible: false
  };

  onButton = async () => {
    let data = await App.getKey();
    const currentDate = this.getFormattedDate();
    const todayWasChecked = data.some((el)=>{
      return el.currentDate === currentDate
    });

    if(!todayWasChecked) {
      const index = data.length;

      data.push({
        currentDate,
        index
      });

      await App.saveAllDataToAsyncStore([...data]);
      this.syncState();
      await this.setState({
        message: '+1 today :)'
      });
      this.alert('success');
    } else {
      await this.setState({
        message: 'You already made a checkout today, sorry... ):'
      });
      this.alert('warning');
    }
  };

  getFormattedDate = () => {
      const today = new Date();
      let dd = today.getDate();
      let mm = today.getMonth()+1;

      const yyyy = today.getFullYear();
      if(dd<10) dd='0'+dd;
      if(mm<10) mm='0'+mm;
      return `${yyyy}-${mm}-${dd}`;
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
    const data = await App.getKey();
    const count = data.length;
    this.setState({
      count,
      data: [...data]
    });
  };

  getRandomColor = () => {
    let o = Math.round, r = Math.random, s = 255;
    return 'rgba(' + o(r()*s) + ',' + o(r()*s) + ',' + o(r()*s) + ',' + r().toFixed(1) + ')';
  };

  markDates = () => {

    const { data } = this.state;
    let temp = data.map( el => {
      return {
        [`${el.currentDate}`] : {
          marked: true,
          dotColor: this.getRandomColor()
        }
      }
    });

    temp = this.arrayToObj(temp ,function (item) {
      const firstItemInObject = Object.keys(item)[0];
      return {
        key: firstItemInObject,
        value: item[firstItemInObject]
      };
    })

    return temp;

  };

  arrayToObj (array, fn) {
    var obj = {};
    var len = array.length;
    for (var i = 0; i < len; i++) {
      var item = fn(array[i], i, array);
      obj[item.key] = item.value;
    }
    return obj;
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
      await App.initStorage();
      this.syncState();
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

  alert = (alertType ) => {
    debugger;
    MessageBarManager.showAlert({
      title: 'Alert message',
      message: this.state.message,
      alertType: alertType || 'success',
    });

    setTimeout(()=> {
      MessageBarManager.hideAlert();
    }, 3000);
  };

  static async getKey() {
    return JSON.parse(await AsyncStorage.getItem(KEY_NAME));
  }

  static async saveAllDataToAsyncStore(value) {
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
    if (value.toLowerCase().trim() === 'yes') {
      await this.setState({
        promptVisible: false,
        message: `You cleared data storage`
      });

      await App.saveAllDataToAsyncStore([]);
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
              markedDates={this.markDates()}
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