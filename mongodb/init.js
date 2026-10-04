db = db.getSiblingDB(
    'chat_app'
);

db.createCollection(
    'users'
);

db.createCollection(
    'messages'
);

db.createCollection(
    'friends'
);

db.createCollection(
    'calls'
);