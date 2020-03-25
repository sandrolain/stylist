/**
 * @jest-environment jsdom
 */

import { Sheet } from "./Sheet";

describe("Sheet", () => {

  it("Instantiate a new Sheet", (done) => {
    new Sheet("default", "all");
    done();
  });

  it("Sheet.setProperty()", (done) => {
    const sheet = new Sheet("default", "all");
    const result = sheet.setProperty(".test-selector", "color", "#FF0000");
    expect(result).not.toBeFalsy();
    done();
  });

  it("Sheet.hasProperty()", (done) => {
    const sheet = new Sheet("default", "all");
    const value = "#FF0000";
    sheet.setProperty(".test-selector", "color", value);
    const result = sheet.hasProperty(".test-selector", "color");
    expect(result).toBeTruthy();
    done();
  });

  it("Sheet.getProperty()", (done) => {
    const sheet = new Sheet("default", "all");
    const value = "#FF0000";
    sheet.setProperty(".test-selector", "color", value);
    const result = sheet.getProperty(".test-selector", "color");
    expect(result).toEqual(value);
    done();
  });


});
