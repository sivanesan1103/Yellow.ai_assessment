const mongoose = require("mongoose");

const ProjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxLength: 100
    },
    description: {
        type: String,
        maxLength: 500,
        default: ""
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    isDefault: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for better query performance
ProjectSchema.index({ userId: 1 });
ProjectSchema.index({ userId: 1, isDefault: 1 });

// Ensure only one default project per user
ProjectSchema.pre('save', async function(next) {
    if (this.isDefault && this.isModified('isDefault')) {
        // Remove default flag from other projects of the same user
        await mongoose.model('Project').updateMany(
            { userId: this.userId, _id: { $ne: this._id } },
            { isDefault: false }
        );
    }
    next();
});

const Project = mongoose.model('Project', ProjectSchema);

module.exports = Project;