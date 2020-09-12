import React from 'react';
import {Text,View,TouchableOpacity,StyleSheet,TextInput,Image,KeyboardAvoidingView}from 'react-native';
import *as Permissions from 'expo-permissions';
import {BarCodeScanner} from 'expo-barcode-scanner'
import firebase from 'firebase';
import db from '../config';

export default class TransactionScreen extends React.Component{
    constructor(){
        super();
         this.state={
             hasCameraPermissions:null,
             scanned:false,
             scannedBookId:'',
             scannedStudentId:'',
             transactionMessage:'',
             buttonState:'normal'
         }
    }
    getCameraPermissions=async(id)=>{
        const {status}=await Permissions.askAsync(Permissions.CAMERA);
        this.setState({
            hasCameraPermissions:status==="granted",
            buttonState:id,
            scanned:false
        })
    }

    handleBarCodeScanned=async({type,data})=>{
       const {buttonState}=this.state

       if(buttonState==="BookId"){
        this.setState({
            scanned:true,
            scannedBookId:data,
            buttonState:'normal'
        })
       }
       else if(buttonState==="StudentId"){
        this.setState({
            scanned:true,
            scannedStudentId:data,
            buttonState:'normal'
        })
       }
    }
    initiateBookIssue=async()=>{
     //add Transactions
     db.collection("transactions").add({
         'studentId:':this.state.scannedStudentId,
         'bookId':this.state.scannedBookId,
         'date':firebase.firestore.Timestamp.now().toDate(),
         'transactionType':"issue"
     })

     db.collection("books").doc(this.state.scannedBookId).update({
         'bookAvailability':false
     })
     db.collection("students").doc(this.state.scannedStudentId).update({
        'numberOfBooksIssued':firebase.firestore.FieldValue.increment(1)
    })
         
    }
    initiateBookReturn=async()=>{
        //add Transactions
        db.collection("transactions").add({
            'studentId:':this.state.scannedStudentId,
            'bookId':this.state.scannedBookId,
            'date':firebase.firestore.Timestamp.now().toDate(),
            'transactionType':"return"
        })
   
        db.collection("books").doc(this.state.scannedBookId).update({
            'bookAvailability':true
        })
        db.collection("students").doc(this.state.scannedStudentId).update({
           'numberOfBooksIssued':firebase.firestore.FieldValue.increment(-1)
       })
            
       }
       checkBookEligibility=async()=>{
           const bookref=await db.collection("books").where("bookId","==",this.state.scannedBookId).get()
           var transactionType=""
           if(bookref.docs.length==0){
            transactionType=false;
            alert("Book does not exist")
           }
           else{
               bookref.docs.map((doc)=>{
                   var book=doc.data()
                   if(book.bookAvailability){transactionType="Issue"}
                   else{transactionType="Return"}
               })
           }
           return transactionType
       }
       checkStudentEligibilityforBookIssue=async()=>{
        const studentref=await db.collection("students").where("studentId","==",this.state.scannedStudentId).get()
        var isStudentEligible=""
        if(studentref.docs.length==0){
         isStudentEligible=false;
         alert("Please give the correct studentID")
         this.setState({
             scannedStudentId:'',
             scannedBookId:''
         })
        }
        else{
            studentref.docs.map((doc)=>{
                var student=doc.data()
                if(student.numberOfBooksIssued<2){
                    isStudentEligible=true
                }
                else{
                    isStudentEligible=false
                    alert("You have issued the maximum books you can issue")
                    this.setState({
                        scannedStudentId:'',
                        scannedBookId:''
                    })
                }
            })
        }
        return isStudentEligible
    }
    checkStudentEligibilityforReturn=async()=>{
        const transactionref=await db.collection("transactions").where("bookId","==",this.state.scannedBookId).limit(1).get()
        var isStudentEligible=""
        transactionref.docs.map((doc)=>{
            var lastbooktransaction=doc.data();
            if(lastbooktransaction.studentId===this.state.scannedStudentId){
                isStudentEligible=true
            }
            else{
                isStudentEligible=false
                alert("This book is not available in our library")
                this.setState({
                    scannedStudentId:'',
                    scannedBookId:''
                })
            }
        })
        return isStudentEligible
  
    }
    handleTransaction=async()=>{
    var transactionType=await this.checkBookEligibility();
    if (!transactionType){
        alert("The book does not exist in our library");
        this.setState({
            scannedStudentId:'',
            scannedBookId:''
        })
    }
    else if(transactionType==="Issue"){
        var isStudentEligible=await this.checkStudentEligibilityforBookIssue()
        if(isStudentEligible){
            this.initiateBookIssue()
            alert("Book issue to the Student")
        }
    }

    else{
        var isStudentEligible=await this.checkStudentEligibilityforReturn()
        if(isStudentEligible){
            this.initiateBookReturn()
            alert("Book returned to the Library")
        }  
    }
    }

    render(){
       const hasCameraPermissions=this.state.hasCameraPermissions;
       const scanned=this.state.scanned;
       const buttonState=this.state.buttonState;

       if(buttonState!=="normal" && hasCameraPermissions){
           return(
               <BarCodeScanner 
               onBarCodeScanned={scanned?undefined:this.handleBarCodeScanned}
               style={StyleSheet.absoluteFillObject}
               />
           )
       }

       else if(buttonState==="normal"){
           return(
               <KeyboardAvoidingView style={styles.container} behaviour="padding" enabled>
                  <View>

                  <Image
                     source={require("../assets/booklogo.png")}
                     style={{width:40*5,height:40*5}}
                 /> 

                   <Text style={{textAlign:'center',fontSize:30}}>Willy</Text>
                  </View>

                  <View style={styles.inputView}>
                      <TextInput
                      style={styles.inputBox}
                      placeHolder="Book ID"
                      onChangeText={text=>this.setState({scannedBookId:text})}
                      value={this.state.scannedBookId}/>
                      <TouchableOpacity
                      style={styles.scanButton}
                      onPress={()=>{
                          this.getCameraPermissions("BookId")
                      }}>

                          <Text style={styles.buttonText}>Scan</Text>
                      </TouchableOpacity>
                  </View>
                  <View style={styles.inputView}>
                      <TextInput
                      style={styles.inputBox}
                      placeHolder="Student ID"
                      onChangeText={text=>this.setState({scannedStudentId:text})}
                      value={this.state.scannedStudentId}/>
                      <TouchableOpacity
                      style={styles.scanButton}
                      onPress={()=>{
                          this.getCameraPermissions("StudentId")
                      }}>
                          <Text style={styles.buttonText}>Scan</Text>
                      </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                  style={styles.submitButton}
                  onPress={async()=>{
                      var TransactionMessage=await this.handleTransaction() 
                  }}>

                      <Text style={styles.submitButtonText}>Submit</Text>
                  </TouchableOpacity>
                
               </KeyboardAvoidingView>
           )
       }
    }
}
const styles=StyleSheet.create({
    container:{
        flex:1,
        justifyContent:'center',
        alignItems:'center'
    },

    displayText:{
        fontSize:15,
        textDecorationLine:'underline'
    },

    scanButton:{
        backgroundColor:'#2196f3',
        padding:10,
        margin:10
    },

    buttonText:{
        fontSize:20,
        textAlign:"center",
        marginTop:10
    },

    inputView:{
        flexDirection:'row',
        margin:20
    },

    inputBox:{
        width:200,
        height:40,
        borderWidth:1.5,
        borderRightWidth:0,
        fontSize:20
    },

    scanButton:{
        backgroundColor:'#666bb6a',
        width:60,
        borderWidth:1.5,
        BorderLeftWidth:0
    },

    submitButton:{
        backgroundColor:'#fbco2d',
        width:100,
        height:50,
    },

    submitButtontext:{
        padding:10,
        textAlign:'center',
        fontSize:20,
        fontWeight:'bold',
        color:'white'
    }
    
})