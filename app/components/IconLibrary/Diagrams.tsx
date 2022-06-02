import {Icon, Props} from "outline-icons";
import React from "react";

export default function Diagrams(
    props: Props
): React.ReactElement<React.ComponentProps<any>, any> {
    return (
        <Icon {...props}>
            <path
                d="M19.5 4H4.5C4.22667 4 4 4.22667 4 4.5V5.63333C4 5.91333 4.22667 6.13333 4.5 6.13333H5.01333C5.01333 8.6 5.01333 13.44 5.01333 15.8933C5.01333 16.6 5.41333 17.0067 6.12 17.0067C7.84667 17.0067 9.57333 17.0067 11.3 17.0067H11.5C11.5 17.4067 11.5 17.7933 11.5 18.18C11.5 18.22 11.44 18.2733 11.4 18.3C11.0133 18.56 10.62 18.82 10.2333 19.08C10.0533 19.2 9.97333 19.38 10.02 19.5933C10.06 19.8067 10.2 19.96 10.4133 19.98C10.54 19.9933 10.7 19.9533 10.8067 19.8867C11.1733 19.66 11.5333 19.42 11.8867 19.1733C11.9733 19.1133 12.0333 19.1133 12.12 19.1733C12.4733 19.4133 12.8267 19.6467 13.18 19.88C13.4533 20.06 13.7467 20.0133 13.9067 19.7733C14.0733 19.5267 14.0067 19.2333 13.7267 19.0467C13.3533 18.7933 12.9867 18.5467 12.6133 18.3067C12.5267 18.2467 12.4933 18.1867 12.4933 18.08C12.4933 17.7267 12.4933 17.3733 12.4933 17H12.68C14.4133 17 16.1533 17 17.8867 17C18.5733 17 18.98 16.5933 18.98 15.9C18.98 13.44 18.98 8.59333 18.98 6.12667H19.4933C19.7733 6.12667 19.9933 5.9 19.9933 5.62667V4.5C19.9933 4.22 19.7667 4 19.4933 4H19.5ZM16.9267 11H15.0067V9.08667C15.7467 9.16 16.7467 9.92667 16.9267 11ZM7.99333 13.9933H7.01333V11.02H7.99333V13.9933V13.9933ZM9.99333 13.9933H9.01333V9.02H9.99333V13.9867V13.9933ZM14.4133 14.0067C13.14 13.9733 12.0667 12.9267 12 11.66C11.9267 10.26 12.9667 9.26 13.9867 9.08V12H16.9267C16.7733 12.9667 15.82 14.04 14.42 14L14.4133 14.0067Z"/>
        </Icon>
    );
}