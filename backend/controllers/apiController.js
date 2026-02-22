// Example API Controller

exports.ping = (req, res) => {
    res.status(200).json({
        success: true,
        data: "Pong! Controller is working.",
        timestamp: new Date().toISOString()
    });
};
