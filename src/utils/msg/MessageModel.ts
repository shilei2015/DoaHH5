
export enum MessageType {
    Text = "text",
    Image = "Image",
    Time = "Time"
}

export class MessageModel {

    constructor(id: string, name: string, avatar: string, msgType: MessageType, textMessage?: string, imageMessage?: string, timeMessage?: Date) {
        this.id = id
        this.name = name
        this.avatar = avatar
        this.msgType = msgType
        this.textMessage = textMessage
        this.imageMessage = imageMessage
        this.timeMessage = timeMessage
    }

    id: string = ""
    name: string = ""
    avatar: string = ""
    msgType: MessageType = MessageType.Text

    textMessage?: string
    imageMessage?: string
    timeMessage?: Date

}

export const mockData: MessageModel[] = [
    new MessageModel("0", "System", "", MessageType.Time, undefined, undefined, new Date("2024-03-24T09:00:00")),
    new MessageModel("1", "Alice", "https://i.pravatar.cc/150?u=alice", MessageType.Text, "Morning Bob! Did you finish the API integration?"),
    new MessageModel("2", "Bob", "https://i.pravatar.cc/150?u=bob", MessageType.Text, "Almost there. Just need to fix one more bug in the authentication flow."),
    new MessageModel("1", "Alice", "https://i.pravatar.cc/150?u=alice", MessageType.Text, "Cool. Let me know if you hit a wall."),
    new MessageModel("0", "System", "", MessageType.Time, undefined, undefined, new Date("2024-03-24T10:00:00")),
    new MessageModel("1", "Alice", "https://i.pravatar.cc/150?u=alice", MessageType.Text, "Btw, I'm sending over the assets for the login page."),
    new MessageModel("1", "Alice", "https://i.pravatar.cc/150?u=alice", MessageType.Image, undefined, "https://picsum.photos/seed/login1/400/300"),
    new MessageModel("1", "Alice", "https://i.pravatar.cc/150?u=alice", MessageType.Image, undefined, "https://picsum.photos/seed/login2/400/300"),
    new MessageModel("2", "Bob", "https://i.pravatar.cc/150?u=bob", MessageType.Text, "Got them! These look sleek. Love the dark mode version."),
    new MessageModel("1", "Alice", "https://i.pravatar.cc/150?u=alice", MessageType.Text, "Thanks! Working on the user profile next."),
    new MessageModel("0", "System", "", MessageType.Time, undefined, undefined, new Date("2024-03-24T11:30:00")),
    new MessageModel("2", "Bob", "https://i.pravatar.cc/150?u=bob", MessageType.Text, "Hey Alice, I just committed the changes to the dev branch."),
    new MessageModel("1", "Alice", "https://i.pravatar.cc/150?u=alice", MessageType.Text, "Perfect. Checking it now."),
    new MessageModel("1", "Alice", "https://i.pravatar.cc/150?u=alice", MessageType.Text, "Wait, is the token expiration handled?"),
    new MessageModel("2", "Bob", "https://i.pravatar.cc/150?u=bob", MessageType.Text, "Ah, good catch. I'll add the interceptor for that."),
    new MessageModel("1", "Alice", "https://i.pravatar.cc/150?u=alice", MessageType.Text, "Alright. I'm going for lunch, back in an hour."),
    new MessageModel("2", "Bob", "https://i.pravatar.cc/150?u=bob", MessageType.Text, "Enjoy! See ya."),
    new MessageModel("0", "System", "", MessageType.Time, undefined, undefined, new Date("2024-03-24T13:45:00")),
    new MessageModel("1", "Alice", "https://i.pravatar.cc/150?u=alice", MessageType.Text, "I'm back. Token expiration looks good now."),
    new MessageModel("2", "Bob", "https://i.pravatar.cc/150?u=bob", MessageType.Text, "Awesome. What's next on the roadmap?"),
    new MessageModel("1", "Alice", "https://i.pravatar.cc/150?u=alice", MessageType.Text, "Setting up the push notification service."),
    new MessageModel("2", "Bob", "https://i.pravatar.cc/150?u=bob", MessageType.Text, "Firebase?"),
    new MessageModel("1", "Alice", "https://i.pravatar.cc/150?u=alice", MessageType.Text, "Most likely. Unless you have a better suggestion?"),
    new MessageModel("2", "Bob", "https://i.pravatar.cc/150?u=bob", MessageType.Text, "Firebase is fine. Reliable and easy to scale."),
    new MessageModel("0", "System", "", MessageType.Time, undefined, undefined, new Date("2024-03-24T15:00:00")),
    new MessageModel("1", "Alice", "https://i.pravatar.cc/150?u=alice", MessageType.Text, "Check this layout for the notification drawer."),
    new MessageModel("1", "Alice", "https://i.pravatar.cc/150?u=alice", MessageType.Image, undefined, "https://picsum.photos/seed/notif/400/300"),
    new MessageModel("2", "Bob", "https://i.pravatar.cc/150?u=bob", MessageType.Text, "Simple and clean. I like the grouping of messages."),
    new MessageModel("1", "Alice", "https://i.pravatar.cc/150?u=alice", MessageType.Text, "Exactly my thoughts."),
    new MessageModel("2", "Bob", "https://i.pravatar.cc/150?u=bob", MessageType.Text, "By the way, did you see the email from the PM?"),
    new MessageModel("1", "Alice", "https://i.pravatar.cc/150?u=alice", MessageType.Text, "Not yet. What's up?"),
    new MessageModel("2", "Bob", "https://i.pravatar.cc/150?u=bob", MessageType.Text, "They want to push the beta launch to next Friday."),
    new MessageModel("1", "Alice", "https://i.pravatar.cc/150?u=alice", MessageType.Text, "That's tight! We need to hurry with the testing."),
    new MessageModel("0", "System", "", MessageType.Time, undefined, undefined, new Date("2024-03-24T17:00:00")),
    new MessageModel("2", "Bob", "https://i.pravatar.cc/150?u=bob", MessageType.Text, "I'll start drafting the unit tests now."),
    new MessageModel("1", "Alice", "https://i.pravatar.cc/150?u=alice", MessageType.Text, "I'll handle the UI integration tests."),
    new MessageModel("2", "Bob", "https://i.pravatar.cc/150?u=bob", MessageType.Text, "Teamwork makes the dream work!"),
    new MessageModel("1", "Alice", "https://i.pravatar.cc/150?u=alice", MessageType.Text, "Haha, standard dev quote."),
    new MessageModel("2", "Bob", "https://i.pravatar.cc/150?u=bob", MessageType.Text, "True though."),
    new MessageModel("1", "Alice", "https://i.pravatar.cc/150?u=alice", MessageType.Text, "Anyway, let's focus. No more distractions."),
    new MessageModel("2", "Bob", "https://i.pravatar.cc/150?u=bob", MessageType.Text, "Copy that."),
    new MessageModel("0", "System", "", MessageType.Time, undefined, undefined, new Date("2024-03-24T18:30:00")),
    new MessageModel("1", "Alice", "https://i.pravatar.cc/150?u=alice", MessageType.Text, "Dinner time?"),
    new MessageModel("2", "Bob", "https://i.pravatar.cc/150?u=bob", MessageType.Text, "Yes please. I'm starving."),
    new MessageModel("1", "Alice", "https://i.pravatar.cc/150?u=alice", MessageType.Text, "Pizza or Sushi?"),
    new MessageModel("2", "Bob", "https://i.pravatar.cc/150?u=bob", MessageType.Text, "Pizza! Let's go to the Italian place down the street."),
    new MessageModel("1", "Alice", "https://i.pravatar.cc/150?u=alice", MessageType.Text, "Sounds like a plan. See you there in 10."),
    new MessageModel("2", "Bob", "https://i.pravatar.cc/150?u=bob", MessageType.Text, "Wait, should I bring my laptop just in case?"),
    new MessageModel("1", "Alice", "https://i.pravatar.cc/150?u=alice", MessageType.Text, "No way! Strictly no coding during dinner."),
    new MessageModel("2", "Bob", "https://i.pravatar.cc/150?u=bob", MessageType.Text, "Roger that. Laptop stays here."),
    new MessageModel("1", "Alice", "https://i.pravatar.cc/150?u=alice", MessageType.Text, "Good. See you!"),
]