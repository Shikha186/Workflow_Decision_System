
exports.mockCreditCheck = async (payload) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Simulate a network failure 30% of the time
            const isNetworkFailure = Math.random() < 0.3;
            
            if (isNetworkFailure) {
                reject(new Error("External Credit API Gateway Timeout"));
            } else {
                // If it connects, return a dummy score based on the payload name, or just default to 750 if no name is provided.
                resolve({ 
                    creditScore: payload.applicantName === 'John Doe' ? 600 : 750 
                });
            }
        }, 1000); // 1-second simulated delay
    });
};