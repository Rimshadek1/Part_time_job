var db = require('../config/connection')
var collection = require('../config/collection');
const { response } = require('../app');
const { ObjectId } = require('mongodb');
// const { ObjectId } = require('bson');
// const ObjectId = require('mongodb').ObjectId;



module.exports = {
    getAllEvents: () => {
        return new Promise(async (resolve, reject) => {
            let events = await db.get().collection(collection.eventCollection).find().toArray();
            resolve(events);
        })
    },
    addEvent: (event) => {
        return new Promise((resolve, reject) => {
            event.Slot_left = parseInt(event.Slot_left)
            db.get().collection(collection.eventCollection).insertOne(event).then((data) => {
                console.log(data);
                resolve(data.insertedId);
            })
        })
    },
    deleteEvent: (proId) => {
        return new Promise((resolve, reject) => {
            console.log(proId);
            console.log(new ObjectId(proId)); // Add `new` here
            db.get().collection(collection.eventCollection).deleteOne({ _id: new ObjectId(proId) })
                .then((response) => {
                    resolve(response);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    },
    getEventDetails: (proId) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collection.eventCollection).findOne({ _id: new ObjectId(proId) }).then((event) => {
                    resolve(event);
                })

            } catch (error) {
                reject(error);
            }
        });
    }

    ,


    updateEvent: (proId, proDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.eventCollection).updateOne({ _id: new ObjectId(proId) }, {
                $set: {
                    Location: proDetails.Location,
                    Time: proDetails.Time,
                    Date: proDetails.Date,
                    Event_name: proDetails.Event_name,
                    Slot_left: proDetails.Slot_left,
                    ppp: proDetails.ppp

                }
            }).then((response) => {
                resolve()
            })

        })
    },
    addSalary: (details) => {
        return new Promise((resolve, reject) => {
            console.log(details);
            details.mobile = parseInt(details.mobile);

            db.get().collection(collection.salaryCollection).insertOne(details).then((data) => {
                console.log(data);
                resolve(data.insertedId);
            })
        })
    },
    viewSalary: () => {
        return new Promise(async (resolve, reject) => {
            let salary = await db.get().collection(collection.salaryCollection).find().toArray();
            resolve(salary);
        })
    },
    deleteSalary: (proId) => {
        return new Promise((resolve, reject) => {
            console.log(proId);
            console.log(new ObjectId(proId)); // Add `new` here
            db.get().collection(collection.salaryCollection).deleteOne({ _id: new ObjectId(proId) })
                .then((response) => {
                    resolve(response);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    },
    getSalaryDetails: (proId) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collection.salaryCollection).findOne({ _id: new ObjectId(proId) }).then((salary) => {
                    resolve(salary);
                })

            } catch (error) {
                reject(error);
            }
        });
    },
    updateSalary: (proId, proDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.salaryCollection).updateOne({ _id: new ObjectId(proId) }, {
                $set: {
                    mobile: proDetails.mobile,
                    Event: proDetails.Event,
                    Date: proDetails.Date,
                    Salary: proDetails.Salary,
                    Fine: proDetails.Fine

                }
            }).then((response) => {
                resolve()
            })

        })
    },


    getIncome: (mobile) => {
        return new Promise(async (resolve, reject) => {
            try {
                console.log(mobile);
                const response = await db.get().collection(collection.salaryCollection).find({ mobile: mobile }).sort({ datetime: -1 }).toArray();
                resolve(response);
            } catch (err) {
                console.error(err);
                reject(err);
            }
        });
    },
    getIncome1: (mobile) => {
        return new Promise(async (resolve, reject) => {
            try {
                console.log(mobile);
                const response = await db.get().collection(collection.salaryCollection).find({ mobile: mobile }).sort({ datetime: -1 }).limit(5).toArray(); resolve(response);
            } catch (err) {
                console.error(err);
                reject(err);
            }
        });
    },
    totalIncome: (user) => {
        return new Promise(async (resolve, reject) => {

            let total = await db.get().collection(collection.salaryCollection).aggregate([
                {
                    $match: { mobile: user.mobile }
                },
                {
                    $addFields: {
                        Salary: { $toInt: '$Salary' },
                        Fine: { $toInt: '$Fine' },
                        Withdraw: { $toInt: '$Withdraw' },


                    },
                },
                {
                    $group: {
                        _id: null,
                        totalSalary: {
                            $sum: '$Salary',
                        },
                        totalFine: {
                            $sum: '$Fine',
                        },
                        totalWithdraw: {
                            $sum: '$Withdraw'
                        }
                    },
                },
                {
                    $project: {
                        _id: 0,
                        totalSalary: 1,
                        totalFine: 1,
                        totalWithdraw: 1,
                        totalDifference: { $subtract: ['$totalSalary', '$totalWithdraw'] }
                    },
                },
            ]).toArray();

            if (total.length > 0) {
                console.log(total);
                resolve(total[0]);
            } else {
                resolve({ totalSalary: 0, totalFine: 0, totalWithdraw: 0, totalDifference: 0 });
            }

        });
    },
    withdrawSalary: (details) => {
        return new Promise((resolve, reject) => {
            details.mobile = parseInt(details.mobile);

            details.Withdraw = parseInt(details.Withdraw);

            db.get().collection(collection.salaryCollection).insertOne(details).then((data) => {
                console.log(data);
                resolve(data.insertedId);
            })
        })
    }

}


