function requireCoordinator(req, res, next) {
  if (!req.session.user || req.session.user.role !== "coordinator") {
    return res.status(403).send("Forbidden");
  }
  next();
}

module.exports = requireCoordinator;