import React from 'react';
import {Text,View,Flatlist,StyleSheet,TextInput,TouchableOpacity}from 'react-native';
import db from '../config';
import{ScrollView, FlatList} from 'react-native-gesture-handler';

export default class SearchScreen extends React.Component{
    constructor(props){
        super(props);
        this.state={
            allTransactions:[],
            lastVisibleTransaction:null,
            search:''

        }
    }
    fetchMoreTransactions=async()=>{
        var text=this.state.search.toUpperCase()
        var enteredtext=text.split("")
        if(enteredtext[0].toUpperCase()==='B'){
            const transaction=await db.collection("transactions").where('bookId','==',text).startAfter(this.state.lastVisibleTransaction).limit(10).get()
             transaction.docs.map((doc)=>{
                 this.setState({
                     allTransactions:[...this.state.allTransactions,doc.data()],
                     lastVisibleTransaction:doc
                 })
             })
            
        }
        if(enteredtext[0].toUpperCase()==='S'){
            const transaction=await db.collection("transactions").where('studentId','==',text).startAfter(this.state.lastVisibleTransaction).limit(10).get()
             transaction.docs.map((doc)=>{
                 this.setState({
                     allTransactions:[...this.state.allTransactions,doc.data()],
                     lastVisibleTransaction:doc
                 })
             })
            
        }
    }
    SearchTransactions=async(text)=>{
        var enteredtext=text.split("")
        if(enteredtext[0].toUpperCase()==='B'){
            const transaction=await db.collection("transactions").where('bookId','==',text).get()
             transaction.docs.map((doc)=>{
                 this.setState({
                     allTransactions:[...this.state.allTransactions,doc.data()],
                     lastVisibleTransaction:doc
                 })
             })
            
        }
        if(enteredtext[0].toUpperCase()==='S'){
            const transaction=await db.collection("transactions").where('studentId','==',text).get()
             transaction.docs.map((doc)=>{
                 this.setState({
                     allTransactions:[...this.state.allTransactions,doc.data()],
                     lastVisibleTransaction:doc
                 })
             })
            
        }
    }
    componentDidMount=async()=>{
        const query=await db.collection("transactions").limit(10).get()
        query.docs.map((doc)=>{
            this.setState({
                allTransactions:[],
                lastVisibleTransaction:doc
            })
          
        }) 
        console.log(this.state.allTransactions)
    }
    render(){
        return(
          <View style={styles.container}>
              <View style={styles.searchbar}>
                  <TextInput
                  style={styles.bar}
                  placeholder="bookId or StudentId"
                  onChangeText={(text)=>{this.setState({search:text})}}/>
                  <TouchableOpacity
                  style={styles.searchButton}
                  onPress={()=>{this.SearchTransactions(this.state.search)}}>
                      <Text>Search Button</Text>
                  </TouchableOpacity>
              </View>
              <FlatList
              data={this.state.allTransactions}
              renderItem={({item})=>(
                  <View style={{borderBottomWidth:2}}>
                     <Text>{"Book ID: "+item.bookId}</Text> 
                     <Text>{"Student ID: "+item.studentId}</Text> 
                     <Text>{"transactionType: "+item.transactionType}</Text> 
                     <Text>{"Date: "+item.date.toDate()}</Text> 
                  </View>

              )}
              keyExtractor={(item,index)=>index.toString()}
              onEndReached={this.fetchMoreTransactions}
              onEndReachedThreshold={0.7}
              />
          </View>
        )
    }
}
const styles=StyleSheet.create({
    container:{
        flex:1,
        marginTop:20
    },
    searchBar:{
        flexDirection:'row',
        height:40,
        width:'auto',
        borderWidth:0.5,
        alignItems:'center',
        backgroundColor:'grey'
    },
    bar:{
        borderWidth:2,
        height:30,
        width:300,
        paddingLeft:10

    },
    searchButton:{
        borderWidth:1,
        height:30,
        width:50,
        alignItems:'center',
        justifyContent:'center',
        backgroundColor:'green'
    }
})