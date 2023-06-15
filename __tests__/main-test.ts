// Copyright (c) HashiCorp, Inc
// SPDX-License-Identifier: MPL-2.0
import "cdktf/lib/testing/adapters/jest"; // Load types for expect matchers
import { Testing } from "cdktf";
import { Instance } from "@cdktf/provider-aws/lib/instance";
import { SecurityGroup } from "@cdktf/provider-aws/lib/security-group";
import { UbuntuEc2Instance } from "../UbuntuEc2Instance";

describe("My CDKTF Application", () => {
  // The tests below are example tests, you can find more information at
  // https://cdk.tf/testing
  describe("UbuntuInstance", () => {
    it("should contain the name as tags.Name", () => {
      expect(
        Testing.synthScope((scope) => {
          new UbuntuEc2Instance(scope, "ubuntu", {
            name: "test-123",
            securityGroup: new SecurityGroup(scope, "sg"),
          });
        })
      ).toHaveResourceWithProperties(Instance, { tags: { Name: "test-123" } });
    });

    it("should contain the name of the security group", () => {
      expect(
        Testing.synthScope((scope) => {
          new UbuntuEc2Instance(scope, "ubuntu", {
            name: "test-123",
            securityGroup: new SecurityGroup(scope, "sg", { name: "test" }),
          });
        })
      ).toHaveResourceWithProperties(Instance, {
        security_groups: ["${aws_security_group.sg.name}"],
      });
    });
  });

  // // All Unit tests test the synthesised terraform code, it does not create real-world resources
  // describe("Unit testing using assertions", () => {
  //   it("should contain a resource", () => {
  //     // import { Image,Container } from "./.gen/providers/docker"
  //     expect(
  //       Testing.synthScope((scope) => {
  //         new MyApplicationsAbstraction(scope, "my-app", {});
  //       })
  //     ).toHaveResource(Container);

  //     expect(
  //       Testing.synthScope((scope) => {
  //         new MyApplicationsAbstraction(scope, "my-app", {});
  //       })
  //     ).toHaveResourceWithProperties(Image, { name: "ubuntu:latest" });
  //   });
  // });

  // describe("Unit testing using snapshots", () => {
  //   it("Tests the snapshot", () => {
  //     const app = Testing.app();
  //     const stack = new TerraformStack(app, "test");

  //     new TestProvider(stack, "provider", {
  //       accessKey: "1",
  //     });

  //     new TestResource(stack, "test", {
  //       name: "my-resource",
  //     });

  //     expect(Testing.synth(stack)).toMatchSnapshot();
  //   });

  //   it("Tests a combination of resources", () => {
  //     expect(
  //       Testing.synthScope((stack) => {
  //         new TestDataSource(stack, "test-data-source", {
  //           name: "foo",
  //         });

  //         new TestResource(stack, "test-resource", {
  //           name: "bar",
  //         });
  //       })
  //     ).toMatchInlineSnapshot();
  //   });
  // });

  // describe("Checking validity", () => {
  //   it("check if the produced terraform configuration is valid", () => {
  //     const app = Testing.app();
  //     const stack = new TerraformStack(app, "test");

  //     new TestDataSource(stack, "test-data-source", {
  //       name: "foo",
  //     });

  //     new TestResource(stack, "test-resource", {
  //       name: "bar",
  //     });
  //     expect(Testing.fullSynth(app)).toBeValidTerraform();
  //   });

  //   it("check if this can be planned", () => {
  //     const app = Testing.app();
  //     const stack = new TerraformStack(app, "test");

  //     new TestDataSource(stack, "test-data-source", {
  //       name: "foo",
  //     });

  //     new TestResource(stack, "test-resource", {
  //       name: "bar",
  //     });
  //     expect(Testing.fullSynth(app)).toPlanSuccessfully();
  //   });
  // });
});
