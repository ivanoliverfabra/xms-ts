import { XMSDoc } from "./src/XMSDoc";

const doc = XMSDoc.parse("xms/1;username=fabra;ref.item=sword");
console.log(doc.version)
console.log(doc.isFallback)
console.log(doc.entries)
console.log(doc.username)
console.log(doc.toString())
console.log(doc.data)

const doc2 = XMSDoc.parse<{ username: string; ref: { item: string } }>("username=fabra;ref.item=sword");
console.log(doc2.version)
console.log(doc2.isFallback)
console.log(doc2.entries)
console.log(doc2.username)
console.log(doc2.toString())
console.log(doc2.data)

const doc3 = XMSDoc.from({ username: "fabra", ref: { item: "sword" } });
console.log(doc3.version)
console.log(doc3.isFallback)
console.log(doc3.entries)
console.log(doc3.username)
console.log(doc3.toString())
console.log(doc3.data)