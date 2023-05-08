var db = require('../config/connection')
var collection = require('../config/collection')
var bcrypt = require('bcrypt')
const ObjectId = require('mongodb').ObjectId;

const { Vonage } = require('@vonage/server-sdk')
const otpGenerator = require('otp-generator');
const { response } = require('../app');
const otp = otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false, specialChars: false });

const vonage = new Vonage({
    apiKey: "d0702ac0",
    apiSecret: "ycbtvj5s4qxhFbvv"
})




module.exports = {
    // Generate and send OTP via SMS
    generateOpt: (mobileNumber) => {
        return new Promise(async (resolve, reject) => {
            console.log(mobileNumber);
            const code = 91;
            const from = "Vonage APIs";
            const to = code + mobileNumber;
            const text = 'kittiyada otp';
            const otp = Math.floor(Math.random() * 1000000);

            async function sendSMS() {
                await vonage.sms.send({ to, from, text: `Your OTP is ${otp}` })
                    .then(resp => {
                        console.log('Message sent successfully');
                        console.log(resp);
                        resolve(otp);
                    })
                    .catch(err => {
                        console.log('There was an error sending the message.');
                        console.error(err);
                        reject(err);
                    });
            }

            sendSMS();
        });
    },

    // Handle user registration
    doSignup: (userData, otp) => {
        return new Promise(async (resolve, reject) => {
            userData.mobile = parseInt(userData.mobile);
            if (!userData.password1) {
                reject('Password is required');
                return;
            }

            console.log(userData.otp);
            console.log(otp);

            if (userData.otp === otp) {
                // Hash the password and insert user data into the database
                userData.password1 = await bcrypt.hash(userData.password1, 10);
                db.get()
                    .collection(collection.userCollection)
                    .insertOne(userData)
                    .then((data) => {
                        resolve(data.insertedId);
                    });
            } else {
                // Return an error if the OTP is invalid
                const error = 'Invalid OTP';
                reject(error);
            }
        });
    }


    ,

    doLogin: async (userData) => {
        userData.mobile = parseInt(userData.mobile);
        if (!userData.mobile) {
            throw new Error('Email is required');
        }

        try {
            const user = await db.get().collection(collection.userCollection).findOne({ mobile: userData.mobile });

            if (user) {
                const match = await bcrypt.compare(userData.password1, user.password1);
                if (match) {
                    console.log('login');
                    return {
                        user: user,
                        status: true
                    };
                } else {
                    console.log('not match password');
                    return {
                        status: false
                    };
                }
            } else {
                console.log('not login2');
                return {
                    status: false
                };
            }
        } catch (error) {
            console.log('catch catch');
            throw error;
        }
    },
    Booking: (proId, userId) => {
        let proObj = {
            item: new ObjectId(proId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            try {
                const userCart = await db.get().collection(collection.bookCollection).findOne({ user: new ObjectId(userId) });
                if (userCart) {
                    let proExist = userCart.events.findIndex(product => product.item == proId)
                    if (proExist != -1) {
                        db.get().collection(collection.bookCollection)
                            .updateOne({ user: new ObjectId(userId), 'events.item': new ObjectId(proId) },
                                {
                                    $inc: { 'events.$.quantity': 1 }
                                }).then(() => {
                                    resolve()
                                })
                    } else {


                        // If user's cart already exists, add the new product id to the existing array
                        db.get().collection(collection.bookCollection).updateOne(
                            { user: new ObjectId(userId) },
                            { $push: { events: proObj } }
                        ).then(() => {
                            resolve();
                        });
                    }
                } else {
                    // If user's cart doesn't exist, create a new cart object with a single array for products
                    const cartObj = {
                        user: new ObjectId(userId),
                        events: [proObj]
                    };
                    db.get().collection(collection.bookCollection).insertOne(cartObj).then(() => {
                        resolve();
                    });
                }
            } catch (error) {
                reject(error);
            }
        });
    },
    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.bookCollection).aggregate([
                {
                    $match: { user: new ObjectId(userId) }
                }, {
                    $unwind: '$events'
                }, {
                    $lookup: {
                        from: collection.eventCollection,
                        localField: 'events.item',
                        foreignField: '_id',
                        as: 'event'
                    }

                }, {
                    $addFields: {
                        item: '$events.item',
                        quantity: '$events.quantity',
                        event: { $arrayElemAt: ['$event', 0] }
                    }


                }, {
                    $addFields: {
                        'event.ppp': { $toInt: '$event.ppp' },
                        'event.Slot_left': { $toInt: '$event.Slot_left' }
                    }
                }, {
                    $project: {
                        item: 1,
                        quantity: 1,
                        event: 1
                    }
                }
            ]).toArray();

            resolve(cartItems);
        });
    }
    ,

    deleteCart: (details) => {

        console.log('details.cart');
        console.log(details.cart);
        console.log('details.product');
        console.log(details.product);
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.bookCollection)
                .updateOne({
                    _id: new ObjectId(details.cart)
                }, {
                    $pull: { events: { item: new ObjectId(details.event) } }
                }).then((response) => {
                    resolve({ removeProduct: true })
                })
        })

    },
    confirmBooking: (user, event) => {
        console.log(user);
        console.log(event);
        return new Promise((resolve, reject) => {
            let bookObj = {
                userId: new ObjectId(user._id),
                Name: (user.name),
                event: event,
                Date: new Date()
            }
            db.get().collection(collection.confirmBooking).insertOne(bookObj).then((response) => {
                console.log(response);
                db.get().collection(collection.bookCollection).deleteOne({ user: new ObjectId(user._id) })
                resolve(response.insertedId)
            })
            const SlotUpdates = event.map((event) => ({
                updateOne: {
                    filter: { _id: new ObjectId(event.item), Slot_left: { $gte: event.quantity } },
                    update: { $inc: { Slot_left: -event.quantity } },
                },
            }));
            db.get().collection(collection.eventCollection).bulkWrite(SlotUpdates)
                .then((result) => {
                    console.log(result); // check the result of the bulk write operation
                })
                .catch((error) => {
                    console.log(error); // log any errors thrown by the bulk write operation
                });
        })
    },
    getCartCount: (userId) => {
        let count = 0
        return new Promise(async (resolve, reject) => {

            let cart = await db.get().collection(collection.bookCollection).findOne({ user: new ObjectId(userId) })
            if (cart) {
                count = cart.events.length

                console.log(count);
            }
            resolve(count)
        })
    },
    withDrawRequest: (details,user) => {
        console.log(details);
        console.log(user);
        details.mobile=parseInt(details.mobile)
        return new Promise((resolve, reject) => {
            let users = db.get().collection(collection.userCollection).findOne({ mobile:user.mobile })
            if (users) {
                db.get().collection(collection.withDrawCollection).insertOne(details).then((response) => {
                    resolve({ withdraw: true })
                })
            }
        })
    },
    withDrawRequestGpay: (details,user) => {
        console.log(details);
        console.log(user);
        details.mobile=parseInt(details.mobile)
        return new Promise((resolve, reject) => {
            let users = db.get().collection(collection.userCollection).findOne({ mobile:user.mobile })
            if (users) {
                db.get().collection(collection.withDrawCollection).insertOne(details).then((response) => {
                    resolve({ withdraw: true })
                })
            }
        })
    }
    }
 





