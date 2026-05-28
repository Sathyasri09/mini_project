import React from 'react';

const Payment = () => {
    const makePayment = () => {
        var options = {
            key: "rzp_test_mL5jDOIqQ2F3iL",
            key_secret: "EGgijLeX69N4FqNsYbPXT7Qg",
            amount: 1000,  // Replace with dynamic amount
            currency: 'INR',
            name: 'MpTex',
            description: 'Payment for products',
            handler: function (response) {
                alert('Payment successful: ' + response.razorpay_payment_id);
            },
            prefill: {
                name: "sharmila",
                email: "sritharvijay07@gmail.com",
                contact: "9715710666"
            },
            theme: {
                color: '#3399cc'
            }
        };
        var pay = new window.Razorpay(options);
        pay.open();
    };

    return (
        <div className="p-5">
            <h2 className="text-2xl mb-4">Proceed with Payment</h2>
            <button
                onClick={makePayment}
                className="bg-green-600 text-white px-4 py-2 rounded"
            >
                Pay Now
            </button>
        </div>
    );
};

export default Payment;
