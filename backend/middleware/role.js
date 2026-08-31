// Usage: authorize('farmer'), authorize('government', 'admin'), etc.
function authorize(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Not authenticated.' });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. This resource requires role: ${allowedRoles.join(' or ')}.`
            });
        }
        next();
    };
}

module.exports = authorize;
