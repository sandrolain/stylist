import { Sheet } from "./Sheet";

describe("Sheet", () => {

  it("Instantiate a new Sheet", (done) => {
    const sheet = new Sheet("default", "all");

    expect(sheet).toBeInstanceOf(Sheet);
    done();
  });
});
